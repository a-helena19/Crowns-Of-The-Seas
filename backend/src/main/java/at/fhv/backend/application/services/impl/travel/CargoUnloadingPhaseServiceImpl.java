package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.minigame.ObstacleMinigameService;
import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.application.services.minigame.StormMinigameService;
import at.fhv.backend.application.services.minigame.TreasureHuntMinigameService;
import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.application.services.travel.RegressService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.customs.CustomsInspection;
import at.fhv.backend.domain.model.customs.CustomsInspectionOutcome;
import at.fhv.backend.domain.model.customs.RegressFine;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.smuggle.SmuggleOffer;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.CargoRewardBreakdown;
import at.fhv.backend.rest.dtos.websocket.CustomsSummary;
import at.fhv.backend.rest.dtos.websocket.RegressSummary;
import at.fhv.backend.rest.dtos.websocket.TravelCompleteEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CargoUnloadingPhaseServiceImpl implements CargoUnloadingPhaseService {

    private static final String SMUGGLE_DISPLAY_NAME = "Mysteriöse Kiste";

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
    private final RegressService regressService;
    private final StormMinigameService stormMinigameService;
    private final ObstacleMinigameService obstacleMinigameService;
    private final TreasureHuntMinigameService treasureHuntMinigameService;
    private final at.fhv.backend.domain.model.player.SessionPlayerRepository sessionPlayerRepository;

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
            StormMinigameService stormMinigameService,
            ObstacleMinigameService obstacleMinigameService,
            TreasureHuntMinigameService treasureHuntMinigameService,
            CustomsService customsService,
            RegressService regressService,
            SessionPlayerRepository sessionPlayerRepository) {
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
        this.stormMinigameService = stormMinigameService;
        this.obstacleMinigameService = obstacleMinigameService;
        this.treasureHuntMinigameService = treasureHuntMinigameService;
        this.customsService = customsService;
        this.regressService = regressService;
        this.sessionPlayerRepository = sessionPlayerRepository;
    }

    @Override
    @Transactional
    public BigDecimal completeUnloadingPhase(Travel travel, List<SessionCargo> cargosForPlayer) {
        List<SessionCargo> cargosForThisTravel = new ArrayList<>();
        for (SessionCargo cargo : cargosForPlayer) {
            if (isCargoForThisTravel(cargo, travel)) {
                cargosForThisTravel.add(cargo);
            }
        }

        BigDecimal totalBonus = BigDecimal.ZERO;
        Map<UUID, BigDecimal> bonusPerCargo = new HashMap<>();
        for (SessionCargo cargo : cargosForThisTravel) {
            BigDecimal bonus = roundToWholeThaler(rewardCalculationService.calculateBonus(cargo.getReward()));
            bonusPerCargo.put(cargo.getId(), bonus);
            totalBonus = totalBonus.add(bonus);
        }
        totalBonus = roundToWholeThaler(totalBonus);

        markCargosAsDelivered(travel, cargosForPlayer);
        BigDecimal cargoReward = roundToWholeThaler(rewardCalculationService.calculateTotalReward(travel, cargosForThisTravel));

        CustomsInspection inspection = customsService.consumeInspection(travel.getTravelId());
        boolean smuggleConfiscated = inspection != null
                && (inspection.getOutcome() == CustomsInspectionOutcome.COOPERATED
                || inspection.getOutcome() == CustomsInspectionOutcome.BRIBE_FAILED);

        BigDecimal smuggleReward = BigDecimal.ZERO;
        SmuggleOffer acceptedOffer = smuggleService.getAcceptedOfferForTravel(travel.getTravelId());
        if (acceptedOffer != null && !smuggleConfiscated) {
            smuggleReward = roundToWholeThaler(acceptedOffer.getReward());
        } else if (acceptedOffer != null) {
            System.out.println("[CargoUnloading] Smuggle reward forfeited — customs confiscated for travel "
                    + travel.getTravelId());
        }

        PlayerShip shipForRegress = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        double currentCondition = shipForRegress != null ? shipForRegress.getCondition() : 100.0;
        GameSession sessionForRegress = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        int currentTickForRegress = sessionForRegress != null
                ? sessionForRegress.getCurrentTick()
                : travel.getArrivalTick();
        RegressFine regressFine = regressService.consumeFine(
                travel, currentTickForRegress, currentCondition, cargosForThisTravel
        );

        BigDecimal grossBeforeMinigames = roundToWholeThaler(cargoReward.add(totalBonus).add(smuggleReward));
        BigDecimal gross = grossBeforeMinigames;
        gross = ratMinigameService.applyRewardModifier(travel.getTravelId(), gross);
        gross = stormMinigameService.applyRewardModifier(travel.getTravelId(), gross);
        gross = obstacleMinigameService.applyRewardModifier(travel.getTravelId(), gross);
        gross = treasureHuntMinigameService.applyRewardModifier(travel.getTravelId(), gross);
        gross = roundToWholeThaler(gross);

        BigDecimal minigameDelta = roundToWholeThaler(gross.subtract(grossBeforeMinigames));
        BigDecimal minigameDeductions = minigameDelta.compareTo(BigDecimal.ZERO) < 0
                ? minigameDelta.abs()
                : BigDecimal.ZERO;
        BigDecimal minigameBonus = minigameDelta.compareTo(BigDecimal.ZERO) > 0
                ? minigameDelta
                : BigDecimal.ZERO;

        BigDecimal arrivalFine = travel.getDockingFine() != null
                ? roundToWholeThaler(travel.getDockingFine()) : BigDecimal.ZERO;
        BigDecimal departureFine = travel.getDepartureDockingFine() != null
                ? roundToWholeThaler(travel.getDepartureDockingFine()) : BigDecimal.ZERO;
        BigDecimal totalFine = roundToWholeThaler(departureFine.add(arrivalFine));

        BigDecimal pilotageRefund = travel.getPilotageRefund() != null
                ? roundToWholeThaler(travel.getPilotageRefund()) : BigDecimal.ZERO;

        BigDecimal regressTotal = regressFine != null
                ? roundToWholeThaler(regressFine.getTotalFine())
                : BigDecimal.ZERO;

        BigDecimal payout = roundToWholeThaler(gross
                .subtract(totalFine)
                .add(pilotageRefund)
                .subtract(regressTotal));

        BigDecimal customsAlreadyDeducted = BigDecimal.ZERO;
        if (inspection != null) {
            BigDecimal fine = inspection.getFinePaid() != null ? roundToWholeThaler(inspection.getFinePaid()) : BigDecimal.ZERO;
            BigDecimal bribe = inspection.getBribePaid() != null ? roundToWholeThaler(inspection.getBribePaid()) : BigDecimal.ZERO;
            customsAlreadyDeducted = roundToWholeThaler(fine.add(bribe));
        }

        BigDecimal previousBalance = BigDecimal.ZERO;
        BigDecimal newBalance = BigDecimal.ZERO;

        UUID playerId = travel.getPlayerId();
        ISessionPlayer player = sessionPlayerRepository
                .findByUserIdAndSessionId(playerId, travel.getSessionId())
                .orElse(null);
        if (player != null) {
            BigDecimal currentBalance = player.getBalance();
            previousBalance = roundToWholeThaler(currentBalance);

            if (payout.compareTo(BigDecimal.ZERO) > 0) {
                player.addBalance(payout);
            } else if (payout.compareTo(BigDecimal.ZERO) < 0) {
                player.forceSubtractBalance(payout.negate());
            }
            newBalance = roundToWholeThaler(player.getBalance());
            sessionPlayerRepository.save(player);
        }

        RegressSummary regressSummary = toRegressSummary(regressFine);
        sendUnloadingCompleteEvent(
                travel, playerId, cargosForThisTravel,
                previousBalance, newBalance,
                acceptedOffer, bonusPerCargo, totalBonus,
                payout, departureFine, arrivalFine, pilotageRefund,
                inspection, smuggleConfiscated,
                regressSummary,
                cargoReward, smuggleReward, grossBeforeMinigames,
                minigameDeductions, minigameBonus, customsAlreadyDeducted,
                totalFine, regressTotal
        );

        if (acceptedOffer != null) {
            smuggleService.clearAcceptedOfferForTravel(travel.getTravelId());
        }

        for (SessionCargo cargo : cargosForPlayer) {
            if (isCargoForThisTravel(cargo, travel)) {
                sessionCargoRepository.save(cargo);
            }
        }

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship != null) {
            if (ship.getStatus() == ShipStatus.CUSTOMS_CHECK) {
                ship.completeCustomsCheckToPort();
            } else {
                ship.completeUnloading();
            }
            playerShipRepository.save(ship);
        }

        travel.markAsCompleted();
        travelRepository.save(travel);

        regressService.clear(travel.getTravelId());

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

    private RegressSummary toRegressSummary(RegressFine fine) {
        if (fine == null) {
            return null;
        }
        return new RegressSummary(
                fine.getDelayTicks(),
                fine.getToleranceTicks(),
                fine.getOverdueTicks(),
                roundToWholeThaler(fine.getDelayComponent()),
                roundToWholeThaler(fine.getDamageComponent()),
                roundToWholeThaler(fine.getCargoLossComponent()),
                fine.getCargoLossPercent(),
                fine.getDamagePercent(),
                fine.getSpecialCargoMultiplier(),
                fine.hadPerishableCargo(),
                fine.hadFragileCargo(),
                roundToWholeThaler(fine.getTotalFine())
        );
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

    private void sendUnloadingCompleteEvent(Travel travel,
                                            UUID playerId,
                                            List<SessionCargo> cargosForPlayer,
                                            BigDecimal previousBalance,
                                            BigDecimal newBalance,
                                            SmuggleOffer acceptedOffer,
                                            Map<UUID, BigDecimal> bonusPerCargo,
                                            BigDecimal totalBonus,
                                            BigDecimal finalPayout,
                                            BigDecimal departureDockingFine,
                                            BigDecimal arrivalDockingFine,
                                            BigDecimal pilotageRefund,
                                            CustomsInspection inspection,
                                            boolean smuggleConfiscated,
                                            RegressSummary regressSummary,
                                            BigDecimal cargoReward,
                                            BigDecimal smuggleReward,
                                            BigDecimal grossReward,
                                            BigDecimal minigameDeductions,
                                            BigDecimal minigameBonus,
                                            BigDecimal customsPaid,
                                            BigDecimal dockingFines,
                                            BigDecimal regressTotal) {
        try {
            PortId destinationPortId = PortId.of(travel.getDestinationPortId());
            Port destinationPort = portRepository.findById(destinationPortId).orElse(null);
            String destinationPortName = destinationPort != null ? destinationPort.getName() : "Unknown Port";

            System.out.println("[CargoUnloading][Breakdown] travelId=" + travel.getTravelId()
                    + " playerShipId=" + travel.getPlayerShipId()
                    + " destPort=" + travel.getDestinationPortId()
                    + " candidates=" + cargosForPlayer.size());

            List<CargoRewardBreakdown> cargoRewards = new ArrayList<>();
            for (SessionCargo sessionCargo : cargosForPlayer) {
                boolean isForThisShip = sessionCargo.getAssignedPlayerShipId() != null
                        && sessionCargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId());
                boolean isForThisPort = sessionCargo.getDestinationPortId()
                        .equals(travel.getDestinationPortId());
                boolean isDeliveredOrExpired =
                        sessionCargo.getCargoStatus() == CargoStatus.DELIVERED
                                || sessionCargo.getCargoStatus() == CargoStatus.EXPIRED;

                System.out.println("[CargoUnloading][Breakdown]   cargo=" + sessionCargo.getId()
                        + " assignedShip=" + sessionCargo.getAssignedPlayerShipId()
                        + " destPort=" + sessionCargo.getDestinationPortId()
                        + " status=" + sessionCargo.getCargoStatus()
                        + " -> ship=" + isForThisShip + " port=" + isForThisPort + " ok=" + isDeliveredOrExpired);

                if (!(isForThisShip && isForThisPort && isDeliveredOrExpired)) {
                    continue;
                }

                BigDecimal cargoBase = roundToWholeThaler(rewardCalculationService.calculateCargoReward(sessionCargo));
                BigDecimal bonus = bonusPerCargo.getOrDefault(sessionCargo.getId(), BigDecimal.ZERO);
                bonus = roundToWholeThaler(bonus);
                BigDecimal actualReward = roundToWholeThaler(cargoBase.add(bonus));
                int percentage = sessionCargo.getCargoStatus() == CargoStatus.DELIVERED
                        ? 100
                        : calculateExpiredPercentage(sessionCargo.getCargoType());

                Cargo cargo = cargoRepository.findById(sessionCargo.getCargoId()).orElse(null);
                String cargoName = cargo != null ? cargo.getName() : "Unknown Cargo";

                cargoRewards.add(new CargoRewardBreakdown(
                        sessionCargo.getId().toString(),
                        cargoName,
                        destinationPortName,
                        roundToWholeThaler(sessionCargo.getReward()),
                        actualReward,
                        bonus,
                        percentage,
                        sessionCargo.getCargoStatus().toString(),
                        sessionCargo.getCargoType().toString(),
                        travel.getPlayerShipId().toString()
                ));
            }

            if (acceptedOffer != null) {
                String displayName = smuggleConfiscated
                        ? SMUGGLE_DISPLAY_NAME + " (Konfisziert)"
                        : SMUGGLE_DISPLAY_NAME;
                BigDecimal actualSmuggleReward = smuggleConfiscated
                        ? BigDecimal.ZERO
                        : roundToWholeThaler(acceptedOffer.getReward());
                String smuggleStatus = smuggleConfiscated ? "CONFISCATED" : "DELIVERED";

                cargoRewards.add(new CargoRewardBreakdown(
                        acceptedOffer.getId().toString(),
                        displayName,
                        destinationPortName,
                        roundToWholeThaler(acceptedOffer.getReward()),
                        actualSmuggleReward,
                        BigDecimal.ZERO,
                        smuggleConfiscated ? 0 : 100,
                        smuggleStatus,
                        "SMUGGLE",
                        travel.getPlayerShipId().toString()
                ));
            }

            BigDecimal baseReward = travel.getBaseReward() != null ? roundToWholeThaler(travel.getBaseReward()) : BigDecimal.ZERO;

            CustomsSummary customsSummary = null;
            if (inspection != null) {
                customsSummary = new CustomsSummary(
                        inspection.getOutcome() != null ? inspection.getOutcome().name() : "CLEARED",
                        roundToWholeThaler(inspection.getFinePaid()),
                        roundToWholeThaler(inspection.getBribePaid()),
                        inspection.isBribeAttempted(),
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
                    finalPayout,
                    totalBonus,
                    previousBalance,
                    newBalance,
                    departureDockingFine,
                    arrivalDockingFine,
                    pilotageRefund,
                    cargoReward,
                    smuggleReward,
                    grossReward,
                    minigameDeductions,
                    minigameBonus,
                    customsPaid,
                    dockingFines,
                    regressTotal,
                    finalPayout,
                    ratMinigameService.consumeTravelSummary(travel.getTravelId()),
                    stormMinigameService.consumeTravelSummary(travel.getTravelId()),
                    obstacleMinigameService.consumeTravelSummary(travel.getTravelId()),
                    treasureHuntMinigameService.consumeTravelSummary(travel.getTravelId()),
                    customsSummary,
                    regressSummary
            );

            final String broadcastSessionId = travel.getSessionId().toString();
            final TravelCompleteEvent broadcastEvent = event;
            if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                        new org.springframework.transaction.support.TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                webSocketController.broadcastTravelComplete(broadcastSessionId, broadcastEvent);
                            }
                        }
                );
            } else {
                webSocketController.broadcastTravelComplete(broadcastSessionId, broadcastEvent);
            }
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

    private BigDecimal roundToWholeThaler(BigDecimal amount) {
        return amount == null
                ? BigDecimal.ZERO
                : amount.setScale(0, RoundingMode.HALF_UP);
    }
}
