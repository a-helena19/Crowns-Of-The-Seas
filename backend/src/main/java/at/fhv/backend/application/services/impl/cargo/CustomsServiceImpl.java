package at.fhv.backend.application.services.impl.cargo;

import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.customs.CustomsInspection;
import at.fhv.backend.domain.model.customs.exception.CustomsInspectionNotFoundException;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CustomsServiceImpl implements CustomsService {
    private static final double DETECTION_CHANCE_WHEN_SMUGGLING = 0.55;
    private static final double BRIBE_SUCCESS_CHANCE = 0.50;
    private static final int MIN_DETENTION_TICKS = 3;
    private static final int MAX_DETENTION_TICKS = 8;
    private static final BigDecimal FINE_FRACTION_OF_BALANCE = new BigDecimal("0.10");
    private static final BigDecimal MIN_FINE = new BigDecimal("5000");
    private static final BigDecimal MAX_FINE = new BigDecimal("30000");
    private static final BigDecimal BRIBE_FRACTION_OF_FINE = new BigDecimal("0.20");

    private final SessionCargoRepository sessionCargoRepository;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final PortRepository portRepository;
    private final TravelPauseService travelPauseService;
    private final GameSessionWebSocketController webSocketController;

    private final Map<UUID, CustomsInspection> inspectionsByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, CustomsInspection> inspectionsById = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public CustomsServiceImpl(SessionCargoRepository sessionCargoRepository, PlayerShipRepository playerShipRepository, ShipRepository shipRepository,
                              PortRepository portRepository, TravelPauseService travelPauseService, GameSessionWebSocketController webSocketController) {
        this.sessionCargoRepository = sessionCargoRepository;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.portRepository = portRepository;
        this.travelPauseService = travelPauseService;
        this.webSocketController = webSocketController;
    }

    @Override
    public CustomsInspection inspectOnArrival(Travel travel) {
        UUID playerId = travel.getPlayerId();
        UUID travelId = travel.getTravelId();
        UUID playerShipId = travel.getPlayerShipId();

        String shipName = lookupShipName(playerShipId);
        String originPortName = lookupPortName(travel.getOriginPortId());
        String destinationPortName = lookupPortName(travel.getDestinationPortId());

        List<SessionCargo> deliveredCargos = collectCargosForArrival(travel);
        boolean carryingIllegalCargo = deliveredCargos.stream().anyMatch(SessionCargo::isContainsIllegal);

        BigDecimal baseFine = calculateFine(deliveredCargos);
        BigDecimal bribeCost = baseFine.multiply(BRIBE_FRACTION_OF_FINE).setScale(0, RoundingMode.HALF_UP);
        int detentionTicks = MIN_DETENTION_TICKS + random.nextInt(MAX_DETENTION_TICKS - MIN_DETENTION_TICKS + 1);

        CustomsInspection inspection = new CustomsInspection(
                playerId, travel.getSessionId(), travelId, playerShipId, travel.getDestinationPortId(),
                shipName, originPortName, destinationPortName,
                carryingIllegalCargo, baseFine, bribeCost, detentionTicks
        );

        if (!carryingIllegalCargo) {
            // Clean ship — routine inspection passes silently. The frontend shows a small toast.
            inspection.completeAsCleared();
            broadcastInspectionPass(inspection);
            inspectionsByTravelId.put(travelId, inspection);
            inspectionsById.put(inspection.getId(), inspection);
            System.out.println("[Customs] Ship " + shipName + " (player " + playerId + ") inspected — CLEARED");
            return inspection;
        }

        boolean detected = random.nextDouble() < DETECTION_CHANCE_WHEN_SMUGGLING;
        if (!detected) {
            inspection.completeAsHidden();
            broadcastInspectionPass(inspection);
            inspectionsByTravelId.put(travelId, inspection);
            inspectionsById.put(inspection.getId(), inspection);
            System.out.println("[Customs] Ship " + shipName + " (player " + playerId + ") inspected — HIDDEN (lucky)");
            return inspection;
        }

        inspectionsByTravelId.put(travelId, inspection);
        inspectionsById.put(inspection.getId(), inspection);

        travelPauseService.pauseTravel(travelId, travel.getSessionId(), playerId, playerShipId, "CUSTOMS_INSPECTION");

        List<String> illegalCargoLabels = collectIllegalCargoLabels(deliveredCargos);

        CustomsInspectionDialogEvent dialogEvent = new CustomsInspectionDialogEvent(
                inspection.getId().toString(),
                playerId.toString(),
                travelId.toString(),
                playerShipId.toString(),
                shipName,
                originPortName,
                destinationPortName,
                baseFine,
                bribeCost,
                detentionTicks,
                illegalCargoLabels
        );
        webSocketController.broadcastCustomsInspectionDialog(travel.getSessionId().toString(), dialogEvent);

        System.out.println("[Customs] Ship " + shipName + " (player " + playerId + ") inspected — SMUGGLE DETECTED"
                + " — fine: " + baseFine + " T, bribe: " + bribeCost + " T, detention: " + detentionTicks + " ticks");
        return inspection;
    }

    @Override
    public void cooperate(UUID playerId, UUID inspectionId) {
        CustomsInspection inspection = inspectionsById.get(inspectionId);
        if (inspection == null) {
            throw new CustomsInspectionNotFoundException(inspectionId);
        }
        if (!inspection.getPlayerId().equals(playerId)) {
            throw new CustomsInspectionNotFoundException(inspectionId);
        }

        inspection.cooperate();
        broadcastInspectionResolved(inspection);
        resumeTravelForInspection(inspection);

        System.out.println("[Customs] Player " + playerId + " COOPERATED on inspection " + inspectionId
                + " — fine paid: " + inspection.getFinePaid() + " T, detained: " + inspection.getDetentionTicks() + " ticks");
    }

    @Override
    public void bribe(UUID playerId, UUID inspectionId) {
        CustomsInspection inspection = inspectionsById.get(inspectionId);
        if (inspection == null) {
            throw new CustomsInspectionNotFoundException(inspectionId);
        }
        if (!inspection.getPlayerId().equals(playerId)) {
            throw new CustomsInspectionNotFoundException(inspectionId);
        }

        boolean success = random.nextDouble() < BRIBE_SUCCESS_CHANCE;
        inspection.bribe(success);
        broadcastInspectionResolved(inspection);
        resumeTravelForInspection(inspection);

        System.out.println("[Customs] Player " + playerId + " BRIBED on inspection " + inspectionId
                + " — success: " + success
                + " — fine paid: " + inspection.getFinePaid() + " T"
                + ", detained: " + (inspection.isDetained() ? inspection.getDetentionTicks() : 0) + " ticks");
    }

    @Override
    public CustomsInspection peekByTravelId(UUID travelId) {
        return inspectionsByTravelId.get(travelId);
    }

    @Override
    public CustomsInspection consumeInspection(UUID travelId) {
        CustomsInspection inspection = inspectionsByTravelId.remove(travelId);
        if (inspection != null) {
            inspectionsById.remove(inspection.getId());
        }
        return inspection;
    }

    @Override
    public boolean isAwaitingDecision(UUID travelId) {
        CustomsInspection inspection = inspectionsByTravelId.get(travelId);
        return inspection != null && inspection.requiresPlayerDecision();
    }

    private void resumeTravelForInspection(CustomsInspection inspection) {
        travelPauseService.resumeTravel(
                inspection.getTravelId(),
                inspection.getSessionId(),
                inspection.getPlayerId(),
                inspection.getPlayerShipId(),
                "CUSTOMS_RESOLVED");
    }

    private void broadcastInspectionPass(CustomsInspection inspection) {
        CustomsInspectionPassEvent passEvent = new CustomsInspectionPassEvent(
                inspection.getId().toString(),
                inspection.getPlayerId().toString(),
                inspection.getTravelId().toString(),
                inspection.getPlayerShipId().toString(),
                inspection.getShipName(),
                inspection.getOriginPortName(),
                inspection.getDestinationPortName(),
                inspection.getOutcome().name()
        );
        webSocketController.broadcastCustomsInspectionPass(inspection.getSessionId().toString(), passEvent);
    }

    private void broadcastInspectionResolved(CustomsInspection inspection) {
        CustomsInspectionPassEvent resolvedEvent = new CustomsInspectionPassEvent(
                inspection.getId().toString(),
                inspection.getPlayerId().toString(),
                inspection.getTravelId().toString(),
                inspection.getPlayerShipId().toString(),
                inspection.getShipName(),
                inspection.getOriginPortName(),
                inspection.getDestinationPortName(),
                inspection.getOutcome().name()
        );
        webSocketController.broadcastCustomsInspectionResolved(inspection.getSessionId().toString(), resolvedEvent);
    }

    private List<SessionCargo> collectCargosForArrival(Travel travel) {
        List<SessionCargo> all = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());
        List<SessionCargo> result = new ArrayList<>();
        for (SessionCargo cargo : all) {
            boolean sameShip = cargo.getAssignedPlayerShipId() != null
                    && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId());
            boolean sameDestination = cargo.getDestinationPortId().equals(travel.getDestinationPortId());
            boolean stillOnBoard = cargo.getCargoStatus() == CargoStatus.ASSIGNED
                    || cargo.getCargoStatus() == CargoStatus.EXPIRED;
            if (sameShip && sameDestination && stillOnBoard) {
                result.add(cargo);
            }
        }
        return result;
    }

    private List<String> collectIllegalCargoLabels(List<SessionCargo> deliveredCargos) {
        List<String> labels = new ArrayList<>();
        for (SessionCargo cargo : deliveredCargos) {
            if (cargo.isContainsIllegal()) {
                labels.add("Verdächtige Kiste");
            }
        }
        if (labels.isEmpty()) {
            labels.add("Verdächtige Ladung");
        }
        return labels;
    }

    private BigDecimal calculateFine(List<SessionCargo> deliveredCargos) {
        BigDecimal cargoValue = BigDecimal.ZERO;
        for (SessionCargo cargo : deliveredCargos) {
            cargoValue = cargoValue.add(cargo.getReward());
        }
        BigDecimal fine = cargoValue.multiply(FINE_FRACTION_OF_BALANCE).setScale(0, RoundingMode.HALF_UP);
        if (fine.compareTo(MIN_FINE) < 0) {
            fine = MIN_FINE;
        }
        if (fine.compareTo(MAX_FINE) > 0) {
            fine = MAX_FINE;
        }
        return fine;
    }

    private String lookupShipName(UUID playerShipId) {
        PlayerShip playerShip = playerShipRepository.findById(playerShipId).orElse(null);
        if (playerShip == null) {
            return "Schiff";
        }
        Ship ship = shipRepository.findById(playerShip.getShipId()).orElse(null);
        return ship != null ? ship.getName() : "Schiff";
    }

    private String lookupPortName(UUID portId) {
        Port port = portRepository.findById(PortId.of(portId)).orElse(null);
        return port != null ? port.getName() : "Unbekannter Hafen";
    }
}
