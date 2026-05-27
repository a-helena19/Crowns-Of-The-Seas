package at.fhv.backend.application.services.impl.minigame;

import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.minigame.request.RatMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.RatMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.RatMinigameTravelSummary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RatMinigameServiceImpl implements RatMinigameService {
    private static final double TRIGGER_CHANCE_PER_TICK = 0.06;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 12;
    private static final int DEFAULT_REQUIRED_HITS = 8;
    private static final BigDecimal FAILED_REWARD_MODIFIER = new BigDecimal("0.70");
    private static final BigDecimal SUCCESS_REWARD_MODIFIER = BigDecimal.ONE;

    private final TravelPauseService travelPauseService;
    private final GameSessionWebSocketController webSocketController;
    private final Random random = new Random();

    private final Set<UUID> triggeredTravelIds = ConcurrentHashMap.newKeySet();
    private final Map<UUID, PendingRatEvent> pendingEvents = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> rewardModifiersByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, RatSummaryState> summaryByTravelId = new ConcurrentHashMap<>();

    public RatMinigameServiceImpl(TravelPauseService travelPauseService,
                                  GameSessionWebSocketController webSocketController) {
        this.travelPauseService = travelPauseService;
        this.webSocketController = webSocketController;
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
        PendingRatEvent event = new PendingRatEvent(
                eventId,
                travel.getPlayerId(),
                sessionId,
                travelId,
                travel.getPlayerShipId(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_REQUIRED_HITS
        );
        pendingEvents.put(travelId, event);

        travelPauseService.pauseTravel(travelId, sessionId, travel.getPlayerId(), travel.getPlayerShipId(), "RATS");

        RatMinigameEvent socketEvent = new RatMinigameEvent(
                eventId.toString(),
                travel.getPlayerId().toString(),
                sessionId.toString(),
                travelId.toString(),
                travel.getPlayerShipId().toString(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_REQUIRED_HITS
        );

        webSocketController.broadcastRatMinigameEvent(sessionId.toString(), socketEvent);
    }

    @Override
    public RatMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, RatMinigameResultRequest request) {
        PendingRatEvent event = pendingEvents.get(request.getTravelId());
        if (event == null) {
            throw new IllegalArgumentException("No pending rat minigame for this travel.");
        }

        if (!event.eventId().equals(request.getEventId())) {
            throw new IllegalArgumentException("Event id does not match pending rat minigame.");
        }
        if (!event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            throw new IllegalArgumentException("Rat minigame result does not belong to this player/session.");
        }

        String normalizedResult = request.getResult().trim().toUpperCase(Locale.ROOT);
        if (!normalizedResult.equals("SUCCESS") && !normalizedResult.equals("FAILED")) {
            throw new IllegalArgumentException("Result must be SUCCESS or FAILED.");
        }

        pendingEvents.remove(request.getTravelId());

        BigDecimal rewardModifier = normalizedResult.equals("SUCCESS")
                ? SUCCESS_REWARD_MODIFIER
                : FAILED_REWARD_MODIFIER;
        rewardModifiersByTravelId.put(request.getTravelId(), rewardModifier);
        summaryByTravelId.put(request.getTravelId(), new RatSummaryState(true, normalizedResult, BigDecimal.ZERO));

        travelPauseService.resumeTravel(
                request.getTravelId(),
                sessionId,
                playerId,
                event.playerShipId(),
                normalizedResult.equals("SUCCESS") ? "RATS_SUCCESS" : "RATS_FAILED"
        );

        return new RatMinigameSubmitResult(
                "RATS",
                normalizedResult,
                request.getHits(),
                request.getRequiredHits(),
                request.getRemainingSeconds(),
                request.getTimeLimitSeconds(),
                rewardModifier
        );
    }

    @Override
    public BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward) {
        BigDecimal modifier = rewardModifiersByTravelId.remove(travelId);
        if (modifier == null) return totalReward;
        BigDecimal modified = totalReward.multiply(modifier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal penalty = totalReward.subtract(modified).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        RatSummaryState existing = summaryByTravelId.get(travelId);
        if (existing != null) {
            summaryByTravelId.put(travelId, new RatSummaryState(existing.triggered(), existing.result(), penalty));
        }

        return modified;
    }

    @Override
    public RatMinigameTravelSummary consumeTravelSummary(UUID travelId) {
        RatSummaryState summary = summaryByTravelId.remove(travelId);
        if (summary == null) {
            return new RatMinigameTravelSummary(false, null, BigDecimal.ZERO);
        }
        return new RatMinigameTravelSummary(summary.triggered(), summary.result(), summary.penaltyAmount());
    }

    private record PendingRatEvent(
            UUID eventId,
            UUID playerId,
            UUID sessionId,
            UUID travelId,
            UUID playerShipId,
            int timeLimitSeconds,
            int requiredHits
    ) {}

    private record RatSummaryState(
            boolean triggered,
            String result,
            BigDecimal penaltyAmount
    ) {}
}
