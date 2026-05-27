package at.fhv.backend.application.services.impl.minigame;

import at.fhv.backend.application.services.minigame.ObstacleMinigameService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.minigame.request.ObstacleMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.ObstacleMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.ObstacleMinigameTravelSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ObstacleMinigameServiceImpl implements ObstacleMinigameService {
    private static final double TRIGGER_CHANCE_PER_TICK = 0.04;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 24;
    private static final int DEFAULT_START_HEALTH = 100;
    private static final int FAILED_CARGO_LOSS_PERCENT = 50;
    private static final BigDecimal FAILED_REWARD_MODIFIER = new BigDecimal("0.50");
    private static final BigDecimal SUCCESS_REWARD_MODIFIER = BigDecimal.ONE;

    private final TravelPauseService travelPauseService;
    private final GameSessionWebSocketController webSocketController;
    private final PlayerShipRepository playerShipRepository;
    private final PortRepository portRepository;
    private final Random random = new Random();

    private final Set<UUID> triggeredTravelIds = ConcurrentHashMap.newKeySet();
    private final Map<UUID, PendingObstacleEvent> pendingEvents = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> rewardModifiersByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, ObstacleSummaryState> summaryByTravelId = new ConcurrentHashMap<>();

    public ObstacleMinigameServiceImpl(TravelPauseService travelPauseService,
                                       GameSessionWebSocketController webSocketController,
                                       PlayerShipRepository playerShipRepository,
                                       PortRepository portRepository) {
        this.travelPauseService = travelPauseService;
        this.webSocketController = webSocketController;
        this.playerShipRepository = playerShipRepository;
        this.portRepository = portRepository;
    }

    @Override
    public void tryTriggerForTravel(Travel travel, UUID sessionId) {
        UUID travelId = travel.getTravelId();
        if (triggeredTravelIds.contains(travelId)) return;
        if (pendingEvents.containsKey(travelId)) return;
        if (random.nextDouble() >= TRIGGER_CHANCE_PER_TICK) return;

        triggeredTravelIds.add(travelId);

        String originName = findPortName(travel.getOriginPortId());
        String destinationName = findPortName(travel.getDestinationPortId());
        String routeViewType = resolveRouteViewType(originName, destinationName);

        UUID eventId = UUID.randomUUID();
        PendingObstacleEvent event = new PendingObstacleEvent(
                eventId, travel.getPlayerId(), sessionId, travelId, travel.getPlayerShipId(),
                DEFAULT_TIME_LIMIT_SECONDS, DEFAULT_START_HEALTH, routeViewType
        );
        pendingEvents.put(travelId, event);

        travelPauseService.pauseTravel(travelId, sessionId, travel.getPlayerId(), travel.getPlayerShipId(), "OBSTACLE");

        ObstacleMinigameEvent socketEvent = new ObstacleMinigameEvent(
                eventId.toString(),
                travel.getPlayerId().toString(),
                sessionId.toString(),
                travelId.toString(),
                travel.getPlayerShipId().toString(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_START_HEALTH,
                travel.getOriginPortId().toString(),
                originName,
                travel.getDestinationPortId().toString(),
                destinationName,
                routeViewType
        );
        webSocketController.broadcastObstacleMinigameEvent(sessionId.toString(), socketEvent);
    }

    @Override
    @Transactional
    public ObstacleMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, ObstacleMinigameResultRequest request) {
        PendingObstacleEvent event = pendingEvents.get(request.getTravelId());
        if (event == null) throw new IllegalArgumentException("No pending obstacle minigame for this travel.");
        if (!event.eventId().equals(request.getEventId())) throw new IllegalArgumentException("Event id mismatch.");
        if (!event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            throw new IllegalArgumentException("Obstacle result does not belong to this player/session.");
        }

        String normalizedResult = request.getResult().trim().toUpperCase(Locale.ROOT);
        if (!normalizedResult.equals("SUCCESS") && !normalizedResult.equals("FAILED")) {
            throw new IllegalArgumentException("Result must be SUCCESS or FAILED.");
        }

        String routeViewType = normalizeRouteView(request.getRouteViewType(), event.routeViewType());
        pendingEvents.remove(request.getTravelId());

        if (normalizedResult.equals("SUCCESS")) {
            rewardModifiersByTravelId.put(request.getTravelId(), SUCCESS_REWARD_MODIFIER);
            summaryByTravelId.put(request.getTravelId(),
                    new ObstacleSummaryState(true, "SUCCESS", BigDecimal.ZERO, 0, 0.0, null, routeViewType));
            travelPauseService.resumeTravel(request.getTravelId(), sessionId, playerId, event.playerShipId(), "OBSTACLE_SUCCESS");
            return new ObstacleMinigameSubmitResult(
                    "OBSTACLE", "SUCCESS", request.getRemainingHealth(), request.getTimeLeftSeconds(),
                    request.getTimeLimitSeconds(), null, routeViewType, SUCCESS_REWARD_MODIFIER
            );
        }

        return applyFailedObstacleConsequences(playerId, sessionId, event, request, routeViewType);
    }

    private ObstacleMinigameSubmitResult applyFailedObstacleConsequences(UUID playerId, UUID sessionId,
                                                                         PendingObstacleEvent event,
                                                                         ObstacleMinigameResultRequest request,
                                                                         String routeViewType) {
        PlayerShip playerShip = playerShipRepository.findById(event.playerShipId()).orElseThrow();
        double conditionBefore = playerShip.getCondition();
        double conditionDamage = conditionBefore / 2.0;
        playerShip.applyWear(conditionDamage);
        playerShipRepository.save(playerShip);

        rewardModifiersByTravelId.put(request.getTravelId(), FAILED_REWARD_MODIFIER);
        summaryByTravelId.put(request.getTravelId(),
                new ObstacleSummaryState(true, "FAILED", BigDecimal.ZERO, FAILED_CARGO_LOSS_PERCENT,
                        conditionDamage, request.getFailureReason(), routeViewType));
        travelPauseService.resumeTravel(request.getTravelId(), sessionId, playerId, event.playerShipId(), "OBSTACLE_FAILED");

        return new ObstacleMinigameSubmitResult(
                "OBSTACLE", "FAILED", request.getRemainingHealth(), request.getTimeLeftSeconds(),
                request.getTimeLimitSeconds(), request.getFailureReason(), routeViewType, FAILED_REWARD_MODIFIER
        );
    }

    @Override
    public BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward) {
        BigDecimal modifier = rewardModifiersByTravelId.remove(travelId);
        if (modifier == null) return totalReward;

        BigDecimal modified = totalReward.multiply(modifier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal penalty = totalReward.subtract(modified).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        ObstacleSummaryState existing = summaryByTravelId.get(travelId);
        if (existing != null) {
            summaryByTravelId.put(travelId, new ObstacleSummaryState(
                    existing.triggered(), existing.result(), penalty, existing.cargoLossPercent(),
                    existing.conditionDamagePercent(), existing.failureReason(), existing.routeViewType()
            ));
        }

        return modified;
    }

    @Override
    public ObstacleMinigameTravelSummary consumeTravelSummary(UUID travelId) {
        ObstacleSummaryState summary = summaryByTravelId.remove(travelId);
        if (summary == null) {
            return new ObstacleMinigameTravelSummary(false, null, BigDecimal.ZERO, 0, 0.0, null, null);
        }
        return new ObstacleMinigameTravelSummary(
                summary.triggered(), summary.result(), summary.penaltyAmount(), summary.cargoLossPercent(),
                summary.conditionDamagePercent(), summary.failureReason(), summary.routeViewType()
        );
    }

    private String findPortName(UUID portId) {
        Optional<Port> port = portRepository.findById(PortId.of(portId));
        return port.map(Port::getName).orElse("");
    }

    private String resolveRouteViewType(String originName, String destinationName) {
        String route = ((originName == null ? "" : originName) + " " + (destinationName == null ? "" : destinationName))
                .toLowerCase(Locale.ROOT);
        if (route.contains("mumbai")
                || route.contains("singapur")
                || route.contains("shanghai")
                || route.contains("sydney")
                || route.contains("phillipinen")
                || route.contains("indian ocean")) {
            return "VIEW_B";
        }
        return "VIEW_A";
    }

    private String normalizeRouteView(String requested, String fallback) {
        if (requested == null) return fallback;
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("VIEW_A") || normalized.equals("VIEW_B")) return normalized;
        return fallback;
    }

    private record PendingObstacleEvent(
            UUID eventId,
            UUID playerId,
            UUID sessionId,
            UUID travelId,
            UUID playerShipId,
            int timeLimitSeconds,
            int startHealth,
            String routeViewType
    ) {}

    private record ObstacleSummaryState(
            boolean triggered,
            String result,
            BigDecimal penaltyAmount,
            int cargoLossPercent,
            double conditionDamagePercent,
            String failureReason,
            String routeViewType
    ) {}
}
