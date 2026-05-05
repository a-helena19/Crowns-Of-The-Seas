package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.CargoRewardBreakdown;
import at.fhv.backend.rest.dtos.websocket.PlayerInfo;
import at.fhv.backend.rest.dtos.websocket.TravelCompleteEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CargoUnloadingPhaseServiceImpl implements CargoUnloadingPhaseService {
    private final SessionCargoRepository sessionCargoRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final RewardCalculationService rewardCalculationService;
    private final GameSessionWebSocketController webSocketController;
    private final PortRepository portRepository;
    private final CargoRepository cargoRepository;

    public CargoUnloadingPhaseServiceImpl(
            SessionCargoRepository sessionCargoRepository,
            PlayerShipRepository playerShipRepository,
            GameSessionRepository gameSessionRepository,
            RewardCalculationService rewardCalculationService,
            GameSessionWebSocketController webSocketController,
            PortRepository portRepository,
            CargoRepository cargoRepository) {
        this.sessionCargoRepository = sessionCargoRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.rewardCalculationService = rewardCalculationService;
        this.webSocketController = webSocketController;
        this.portRepository = portRepository;
        this.cargoRepository = cargoRepository;
    }

    @Override
    @Transactional
    public BigDecimal completeUnloadingPhase(Travel travel, List<SessionCargo> cargosForPlayer) {
        // Two-phase unloading so the reward calculation sees the correct cargo statuses:
        // 1) Mark ASSIGNED cargos as DELIVERED (EXPIRED stays EXPIRED).
        // 2) Calculate the reward — RewardCalculationService filters by DELIVERED/EXPIRED.
        // 3) Pay out, send event. Cargos stay DELIVERED/EXPIRED (no recycling).
        markCargosAsDelivered(travel, cargosForPlayer);

        BigDecimal totalReward = rewardCalculationService.calculateTotalReward(travel, cargosForPlayer);

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
                if (totalReward.compareTo(BigDecimal.ZERO) > 0) {
                    player.addBalance(totalReward);
                }
                newBalance = player.getBalance();
                gameSessionRepository.save(session);
            }
        }

        sendUnloadingCompleteEvent(travel, playerId, cargosForPlayer, previousBalance, newBalance);

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

        return totalReward;
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

    private void sendUnloadingCompleteEvent(Travel travel, UUID playerId,
                                            List<SessionCargo> cargosForPlayer,
                                            BigDecimal previousBalance, BigDecimal newBalance) {
        try {
            PortId destinationPortId = PortId.of(travel.getDestinationPortId());
            Port destinationPort = portRepository.findById(destinationPortId).orElse(null);
            String destinationPortName = destinationPort != null ? destinationPort.getName() : "Unknown Port";

            List<CargoRewardBreakdown> cargoRewards = cargosForPlayer.stream()
                    .filter(sessionCargo -> {
                        boolean isForThisPort = sessionCargo.getDestinationPortId()
                                .equals(travel.getDestinationPortId());
                        boolean isDeliveredOrExpired =
                                sessionCargo.getCargoStatus() == CargoStatus.DELIVERED
                                        || sessionCargo.getCargoStatus() == CargoStatus.EXPIRED;
                        return isForThisPort && isDeliveredOrExpired;
                    })
                    .map(sessionCargo -> {
                        BigDecimal actualReward = rewardCalculationService.calculateCargoReward(sessionCargo);
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
                                percentage,
                                sessionCargo.getCargoStatus().toString(),
                                sessionCargo.getCargoType().toString()
                        );
                    })
                    .toList();

            BigDecimal baseReward = travel.getBaseReward() != null ? travel.getBaseReward() : BigDecimal.ZERO;
            BigDecimal totalReward = rewardCalculationService.calculateTotalReward(travel, cargosForPlayer);

            TravelCompleteEvent event = new TravelCompleteEvent(
                    travel.getTravelId().toString(),
                    playerId.toString(),
                    cargoRewards,
                    baseReward,
                    totalReward,
                    previousBalance,
                    newBalance
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