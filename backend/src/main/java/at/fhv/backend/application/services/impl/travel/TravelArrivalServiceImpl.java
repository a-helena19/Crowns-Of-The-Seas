package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CargoUnloadService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.CargoRewardBreakdown;
import at.fhv.backend.rest.dtos.websocket.TravelCompleteEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class TravelArrivalServiceImpl implements TravelArrivalService {
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final CargoUnloadService cargoUnloadService;
    private final RewardCalculationService rewardCalculationService;
    private final GameSessionWebSocketController webSocketController;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortRepository portRepository;
    private final CargoRepository cargoRepository;

    public TravelArrivalServiceImpl(TravelRepository travelRepository,
                                    PlayerShipRepository playerShipRepository,
                                    GameSessionRepository gameSessionRepository,
                                    CargoUnloadService cargoUnloadService,
                                    RewardCalculationService rewardCalculationService,
                                    GameSessionWebSocketController webSocketController,
                                    SessionCargoRepository sessionCargoRepository,
                                    PortRepository portRepository,
                                    CargoRepository cargoRepository) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.cargoUnloadService = cargoUnloadService;
        this.rewardCalculationService = rewardCalculationService;
        this.webSocketController = webSocketController;
        this.sessionCargoRepository = sessionCargoRepository;
        this.portRepository = portRepository;
        this.cargoRepository = cargoRepository;
    }

    @Override
    @Transactional
    public void handleArrival(Travel travel) {
        List<SessionCargo> cargosForPlayer =
                sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());

        travel.markAsArrived(0.0, travel.getTravelStatus());
        travelRepository.save(travel);

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship != null) {
            ship.arriveAtPort(travel.getDestinationPortId());
            playerShipRepository.save(ship);
        }

        cargoUnloadService.unloadCargoForTravel(travel, cargosForPlayer);

        UUID playerId = travel.getPlayerId();
        BigDecimal totalReward = rewardCalculationService.calculateTotalReward(travel, cargosForPlayer);
        BigDecimal previousBalance = BigDecimal.ZERO;
        BigDecimal newBalance = BigDecimal.ZERO;

        if (totalReward.compareTo(BigDecimal.ZERO) > 0) {
            var session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
            if (session != null) {
                ISessionPlayer player = session.getPlayers().stream()
                        .filter(p -> p.getUserId().equals(playerId))
                        .findFirst()
                        .orElse(null);

                if (player != null) {
                    previousBalance = player.getBalance();
                    player.addBalance(totalReward);
                    newBalance = player.getBalance();
                    gameSessionRepository.save(session);
                }
            }
        } else {
            var session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
            if (session != null) {
                ISessionPlayer player = session.getPlayers().stream()
                        .filter(p -> p.getUserId().equals(playerId))
                        .findFirst()
                        .orElse(null);
                if (player != null) {
                    previousBalance = player.getBalance();
                    newBalance = player.getBalance();
                }
            }
        }

        sendTravelCompleteEvent(travel, playerId, cargosForPlayer, previousBalance, newBalance);
    }

    private void sendTravelCompleteEvent(Travel travel, UUID playerId,
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
            System.err.println("Error sending travel complete event: " + e.getMessage());
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