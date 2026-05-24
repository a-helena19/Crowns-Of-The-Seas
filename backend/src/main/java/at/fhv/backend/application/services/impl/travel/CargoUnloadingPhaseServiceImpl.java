package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.customs.CustomsService;
import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.customs.CustomsInspection;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.smuggle.SmuggleOffer;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.CargoRewardBreakdown;
import at.fhv.backend.rest.dtos.websocket.CustomsSummary;
import at.fhv.backend.rest.dtos.websocket.TravelCompleteEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class CargoUnloadingPhaseServiceImpl implements CargoUnloadingPhaseService {
    private final SessionCargoRepository sessionCargoRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final RewardCalculationService rewardCalculationService;
    private final GameSessionWebSocketController webSocketController;
    private final PortRepository portRepository;
    private final CargoRepository cargoRepository;
    private final SmuggleService smuggleService;
    private final TravelRepository travelRepository;
    private final RatMinigameService ratMinigameService;
    private final CustomsService customsService;

    public CargoUnloadingPhaseServiceImpl(
            SessionCargoRepository sessionCargoRepository,
            PlayerShipRepository playerShipRepository,
            GameSessionRepository gameSessionRepository,
            RewardCalculationService rewardCalculationService,
            GameSessionWebSocketController webSocketController,
            PortRepository portRepository,
            CargoRepository cargoRepository,
            SmuggleService smuggleService,
            TravelRepository travelRepository,
            RatMinigameService ratMinigameService,
            CustomsService customsService) {
        this.sessionCargoRepository = sessionCargoRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.rewardCalculationService = rewardCalculationService;
        this.webSocketController = webSocketController;
        this.portRepository = portRepository;
        this.cargoRepository = cargoRepository;
        this.smuggleService = smuggleService;
        this.travelRepository = travelRepository;
        this.ratMinigameService = ratMinigameService;
        this.customsService = customsService;
    }

    @Override
    @Transactional
    public BigDecimal completeUnloadingPhase(Travel travel, List<SessionCargo> cargosForPlayer) {
        BigDecimal totalBonus = BigDecimal.ZERO;
        Map<UUID, BigDecimal> bonusPerCargo = new HashMap<>();
        for (SessionCargo cargo : cargosForPlayer) {
            if (isCargoForThisTravel(cargo, travel)) {
                BigDecimal bonus = rewardCalculationService.calculateBonus(cargo.getReward());
                bonusPerCargo.put(cargo.getId(), bonus);
                totalBonus = totalBonus.add(bonus);
            }
        }

        markCargosAsDelivered(travel, cargosForPlayer);

        BigDecimal cargoReward = rewardCalculationService.calculateTotalReward(travel, cargosForPlayer);

        BigDecimal smuggleReward = BigDecimal.ZERO;
        List<SmuggleOffer> smuggleOffers = smuggleService.getAllAcceptedOffers(travel.getPlayerId());
        for (SmuggleOffer smuggleOffer : smuggleOffers) {
            smuggleReward = smuggleReward.add(smuggleOffer.getReward());
        }

        BigDecimal totalReward = cargoReward.add(totalBonus).add(smuggleReward);
        totalReward = ratMinigameService.applyRewardModifier(travel.getTravelId(), totalReward);

        // Customs: subtract any fine from the final payout. The inspection was performed on arrival;
        // by the time we get here it must be in a terminal state (CLEARED / HIDDEN / COOPERATED / BRIBE_*).
        CustomsInspection inspection = customsService.consumeInspection(travel.getTravelId());
        BigDecimal customsFine = inspection != null ? inspection.getFinePaid() : BigDecimal.ZERO;
        BigDecimal payout = totalReward.subtract(customsFine);
        if (payout.compareTo(BigDecimal.ZERO) < 0) {
            payout = BigDecimal.ZERO;
        }

        BigDecimal previousBalance = BigDecimal.ZERO;
        BigDecimal newBalance = BigDecimal.ZERO;

        UUID playerId = travel.getPlayerId();
        var session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        if (session != null) {
            ISessionPlayer player = session.getPlayers().stream()
                    .filter(p -> p.getUserId().equals(playerId))
                    .findFirst()
                    .orElse(null);

            if (player != null) {
                previousBalance = player.getBalance();
                if (payout.compareTo(BigDecimal.ZERO) > 0) {
                    player.addBalance(payout);
                }
                newBalance = player.getBalance();
                gameSessionRepository.save(session);
            }
        }

        sendUnloadingCompleteEvent(
                travel, playerId, cargosForPlayer, previousBalance, newBalance, smuggleOffers,
                bonusPerCargo, totalBonus, payout, inspection
        );

        if (!smuggleOffers.isEmpty()) {
            smuggleService.clearAcceptedOffer(playerId);
        }

        for (SessionCargo cargo : cargosForPlayer) {
            if (isCargoForThisTravel(cargo, travel)) {
                sessionCargoRepository.save(cargo);
            }
        }

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship != null) {
            ship.completeUnloading();
            playerShipRepository.save(ship);
        }

        travel.markAsCompleted();
        travelRepository.save(travel);

        return payout;
    }

    @Override
    public boolean isUnloadingComplete(UUID playerId, UUID playerShipId, int currentTick) {
        PlayerShip ship = playerShipRepository.findById(playerShipId).orElse(null);
        if (ship == null) {
            return false;
        }
        return !ship.isStillUnloading(currentTick);
    }

    private void markCargosAsDelivered(Travel travel, List<SessionCargo> cargosForPlayer) {
        for (SessionCargo cargo : cargosForPlayer) {
            if (isCargoForThisTravel(cargo, travel) && cargo.getCargoStatus() == CargoStatus.ASSIGNED) {
                cargo.deliver();
                System.out.println("[CargoUnloading] Cargo " + cargo.getId()
                        + " delivered at port " + travel.getDestinationPortId());
            }
        }
    }

    private boolean isCargoForThisTravel(SessionCargo cargo, Travel travel) {
        boolean isForThisShipAndPort = cargo.getAssignedPlayerShipId() != null
                && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId())
                && cargo.getDestinationPortId().equals(travel.getDestinationPortId());

        boolean isAssignedOrExpired = cargo.getCargoStatus() == CargoStatus.ASSIGNED
                || cargo.getCargoStatus() == CargoStatus.EXPIRED;

        return isForThisShipAndPort && isAssignedOrExpired;
    }

    private static final String SMUGGLE_DISPLAY_NAME = "Mysteriöse Kiste";

    private void sendUnloadingCompleteEvent(Travel travel, UUID playerId,
                                            List<SessionCargo> cargosForPlayer,
                                            BigDecimal previousBalance, BigDecimal newBalance,
                                            List<SmuggleOffer> smuggleOffers,
                                            Map<UUID, BigDecimal> bonusPerCargo, BigDecimal totalBonus,
                                            BigDecimal finalTotalReward,
                                            CustomsInspection inspection) {
        try {
            PortId destinationPortId = PortId.of(travel.getDestinationPortId());
            Port destinationPort = portRepository.findById(destinationPortId).orElse(null);
            String destinationPortName = destinationPort != null ? destinationPort.getName() : "Unknown Port";

            List<CargoRewardBreakdown> cargoRewards = new ArrayList<>(cargosForPlayer.stream()
                    .filter(sessionCargo -> {
                        boolean isForThisPort = sessionCargo.getDestinationPortId()
                                .equals(travel.getDestinationPortId());
                        boolean isDeliveredOrExpired =
                                sessionCargo.getCargoStatus() == CargoStatus.DELIVERED
                                        || sessionCargo.getCargoStatus() == CargoStatus.EXPIRED;
                        return isForThisPort && isDeliveredOrExpired;
                    })
                    .map(sessionCargo -> {
                        BigDecimal cargoBase = rewardCalculationService.calculateCargoReward(sessionCargo);
                        BigDecimal bonus = bonusPerCargo.getOrDefault(sessionCargo.getId(), BigDecimal.ZERO);
                        BigDecimal actualReward = cargoBase.add(bonus);
                        int percentage = sessionCargo.getCargoStatus() == CargoStatus.DELIVERED
                                ? 100
                                : calculateExpiredPercentage(sessionCargo.getCargoType());

                        Cargo cargo = cargoRepository.findById(sessionCargo.getCargoId()).orElse(null);
                        String cargoName = cargo != null ? cargo.getName() : "Unknown Cargo";

                        return new CargoRewardBreakdown(
                                sessionCargo.getId().toString(),
                                cargoName,
                                destinationPortName,
                                sessionCargo.getReward(),
                                actualReward,
                                bonus,
                                percentage,
                                sessionCargo.getCargoStatus().toString(),
                                sessionCargo.getCargoType().toString()
                        );
                    })
                    .toList());

            for (SmuggleOffer smuggleOffer : smuggleOffers) {
                String displayName = SMUGGLE_DISPLAY_NAME;
                cargoRewards.add(new CargoRewardBreakdown(
                        smuggleOffer.getId().toString(),
                        displayName,
                        destinationPortName,
                        smuggleOffer.getReward(),
                        smuggleOffer.getReward(),
                        BigDecimal.ZERO,
                        100,
                        "DELIVERED",
                        "SMUGGLE"
                ));
            }

            BigDecimal baseReward = travel.getBaseReward() != null ? travel.getBaseReward() : BigDecimal.ZERO;

            CustomsSummary customsSummary = null;
            if (inspection != null) {
                customsSummary = new CustomsSummary(
                        inspection.getOutcome() != null ? inspection.getOutcome().name() : "CLEARED",
                        inspection.getFinePaid(),
                        inspection.isDetained(),
                        inspection.isDetained() ? inspection.getDetentionTicks() : 0,
                        inspection.isCarryingIllegalCargo()
                );
            }

            TravelCompleteEvent event = new TravelCompleteEvent(
                    travel.getTravelId().toString(),
                    playerId.toString(),
                    cargoRewards,
                    baseReward,
                    finalTotalReward,
                    totalBonus,
                    previousBalance,
                    newBalance,
                    customsSummary
            );

            webSocketController.broadcastTravelComplete(
                    travel.getSessionId().toString(),
                    event
            );
        } catch (Exception e) {
            System.err.println("Error sending unloading complete event: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private int calculateExpiredPercentage(Object cargoType) {
        String type = cargoType.toString();
        return switch (type) {
            case "FOOD", "HAZARDOUS" -> 0;
            case "FRAGILE" -> 10;
            case "ELECTRONICS" -> 15;
            case "LUXURY_GOODS" -> 20;
            case "GENERAL_GOODS" -> 40;
            case "INDUSTRIAL_GOODS" -> 50;
            default -> 0;
        };
    }
}