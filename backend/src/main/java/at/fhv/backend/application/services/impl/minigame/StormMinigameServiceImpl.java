package at.fhv.backend.application.services.impl.minigame;

import at.fhv.backend.application.services.minigame.StormMinigameService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.minigame.request.StormMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.StormMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.StormMinigameTravelSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StormMinigameServiceImpl implements StormMinigameService {
    private static final double TRIGGER_CHANCE_PER_TICK = 0.04;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 20;
    private static final int DEFAULT_REQUIRED_SUNS = 8;
    private static final int DEFAULT_START_HEALTH = 100;
    private static final double FAILED_CONDITION_DAMAGE_PERCENT = 50.0;
    private static final int FAILED_CARGO_LOSS_PERCENT = 50;
    private static final BigDecimal FAILED_REWARD_MODIFIER = new BigDecimal("0.50");
    private static final BigDecimal SUCCESS_REWARD_MODIFIER = BigDecimal.ONE;

    private final TravelPauseService travelPauseService;
    private final GameSessionWebSocketController webSocketController;
    private final PlayerShipRepository playerShipRepository;
    private final Random random = new Random();

    private final Set<UUID> triggeredTravelIds = ConcurrentHashMap.newKeySet();
    private final Map<UUID, PendingStormEvent> pendingEvents = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> rewardModifiersByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, StormSummaryState> summaryByTravelId = new ConcurrentHashMap<>();

    public StormMinigameServiceImpl(TravelPauseService travelPauseService,
                                    GameSessionWebSocketController webSocketController,
                                    PlayerShipRepository playerShipRepository) {
        this.travelPauseService = travelPauseService;
        this.webSocketController = webSocketController;
        this.playerShipRepository = playerShipRepository;
    }

    @Override
    public void tryTriggerForTravel(Travel travel, UUID sessionId) {
        UUID travelId = travel.getTravelId();
        if (travelPauseService.isTravelPaused(travelId)) return;
        if (triggeredTravelIds.contains(travelId)) return;
        if (pendingEvents.containsKey(travelId)) return;
        if (random.nextDouble() >= TRIGGER_CHANCE_PER_TICK) return;

        triggeredTravelIds.add(travelId);
        UUID eventId = UUID.randomUUID();
        PendingStormEvent event = new PendingStormEvent(
                eventId, travel.getPlayerId(), sessionId, travelId, travel.getPlayerShipId(),
                DEFAULT_TIME_LIMIT_SECONDS, DEFAULT_REQUIRED_SUNS, DEFAULT_START_HEALTH
        );
        pendingEvents.put(travelId, event);
        travelPauseService.pauseTravel(travelId, sessionId, travel.getPlayerId(), travel.getPlayerShipId(), "STORM");

        StormMinigameEvent socketEvent = new StormMinigameEvent(
                eventId.toString(),
                travel.getPlayerId().toString(),
                sessionId.toString(),
                travelId.toString(),
                travel.getPlayerShipId().toString(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_REQUIRED_SUNS,
                DEFAULT_START_HEALTH
        );
        webSocketController.broadcastStormMinigameEvent(sessionId.toString(), socketEvent);
    }

    @Override
    @Transactional
    public StormMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, StormMinigameResultRequest request) {
        PendingStormEvent event = pendingEvents.get(request.getTravelId());
        if (event == null) throw new IllegalArgumentException("No pending storm minigame for this travel.");
        if (!event.eventId().equals(request.getEventId())) throw new IllegalArgumentException("Event id mismatch.");
        if (!event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            throw new IllegalArgumentException("Storm result does not belong to this player/session.");
        }

        String normalizedResult = request.getResult().trim().toUpperCase(Locale.ROOT);
        if (!normalizedResult.equals("SUCCESS") && !normalizedResult.equals("FAILED")) {
            throw new IllegalArgumentException("Result must be SUCCESS or FAILED.");
        }

        pendingEvents.remove(request.getTravelId());

        if (normalizedResult.equals("SUCCESS")) {
            rewardModifiersByTravelId.put(request.getTravelId(), SUCCESS_REWARD_MODIFIER);
            summaryByTravelId.put(request.getTravelId(), new StormSummaryState(true, "SUCCESS", BigDecimal.ZERO, 0, 0.0));
            travelPauseService.resumeTravel(request.getTravelId(), sessionId, playerId, event.playerShipId(), "STORM_SUCCESS");
            return new StormMinigameSubmitResult(
                    "STORM", "SUCCESS",
                    request.getCollectedSuns(), request.getRequiredSuns(),
                    request.getRemainingHealth(), request.getTimeLeftSeconds(), request.getTimeLimitSeconds(),
                    BigDecimal.ZERO
            );
        }

        return applyFailedStormConsequences(playerId, sessionId, event, request);
    }

    private StormMinigameSubmitResult applyFailedStormConsequences(UUID playerId, UUID sessionId, PendingStormEvent event,
                                                                   StormMinigameResultRequest request) {
        PlayerShip playerShip = playerShipRepository.findById(event.playerShipId()).orElseThrow();

        rewardModifiersByTravelId.put(request.getTravelId(), FAILED_REWARD_MODIFIER);
        playerShip.applyWear(FAILED_CONDITION_DAMAGE_PERCENT);
        playerShipRepository.save(playerShip);
        summaryByTravelId.put(request.getTravelId(),
                new StormSummaryState(true, "FAILED", BigDecimal.ZERO, FAILED_CARGO_LOSS_PERCENT, FAILED_CONDITION_DAMAGE_PERCENT));
        travelPauseService.resumeTravel(request.getTravelId(), sessionId, playerId, event.playerShipId(), "STORM_FAILED");

        return new StormMinigameSubmitResult(
                "STORM", "FAILED",
                request.getCollectedSuns(), request.getRequiredSuns(),
                request.getRemainingHealth(), request.getTimeLeftSeconds(), request.getTimeLimitSeconds(),
                BigDecimal.ZERO
        );
    }

    @Override
    public Optional<StormMinigameEvent> getPendingEvent(UUID travelId, UUID playerId, UUID sessionId) {
        PendingStormEvent event = pendingEvents.get(travelId);
        if (event == null || !event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            return Optional.empty();
        }

        return Optional.of(new StormMinigameEvent(
                event.eventId().toString(),
                event.playerId().toString(),
                event.sessionId().toString(),
                event.travelId().toString(),
                event.playerShipId().toString(),
                event.timeLimitSeconds(),
                event.requiredSuns(),
                event.startHealth()
        ));
    }

    @Override
    public BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward) {
        BigDecimal modifier = rewardModifiersByTravelId.remove(travelId);
        if (modifier == null) return totalReward;

        BigDecimal modified = totalReward.multiply(modifier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal penalty = totalReward.subtract(modified).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        StormSummaryState existing = summaryByTravelId.get(travelId);
        if (existing != null) {
            summaryByTravelId.put(travelId, new StormSummaryState(
                    existing.triggered(),
                    existing.result(),
                    penalty,
                    existing.cargoLossPercent(),
                    existing.conditionDamagePercent()
            ));
        }

        return modified;
    }

    @Override
    public StormMinigameTravelSummary consumeTravelSummary(UUID travelId) {
        StormSummaryState summary = summaryByTravelId.remove(travelId);
        if (summary == null) {
            return new StormMinigameTravelSummary(false, null, BigDecimal.ZERO, 0, 0.0);
        }
        return new StormMinigameTravelSummary(
                summary.triggered(),
                summary.result(),
                summary.penaltyAmount(),
                summary.cargoLossPercent(),
                summary.conditionDamagePercent()
        );
    }

    private record PendingStormEvent(
            UUID eventId,
            UUID playerId,
            UUID sessionId,
            UUID travelId,
            UUID playerShipId,
            int timeLimitSeconds,
            int requiredSuns,
            int startHealth
    ) {}

    private record StormSummaryState(
            boolean triggered,
            String result,
            BigDecimal penaltyAmount,
            int cargoLossPercent,
            double conditionDamagePercent
    ) {}

}
