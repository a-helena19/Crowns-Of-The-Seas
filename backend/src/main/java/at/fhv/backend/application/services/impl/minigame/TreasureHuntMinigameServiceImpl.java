package at.fhv.backend.application.services.impl.minigame;

import at.fhv.backend.application.services.minigame.TreasureHuntMinigameService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.minigame.request.TreasureHuntMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.TreasureHuntMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.TreasureHuntMinigameTravelSummary;
import org.springframework.stereotype.Service;

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
public class TreasureHuntMinigameServiceImpl implements TreasureHuntMinigameService {
    private static final double TRIGGER_CHANCE_PER_TICK = 1.0;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 20;
    private static final int DEFAULT_REQUIRED_TREASURES = 8;
    private static final int DEFAULT_PIRATE_COUNT = 3;
    private static final int FAILED_CARGO_LOSS_PERCENT = 70;
    private static final int SUCCESS_CHEST_BONUS_MIN = 3000;
    private static final int SUCCESS_CHEST_BONUS_MAX = 5000;
    private static final BigDecimal FAILED_REWARD_MODIFIER = new BigDecimal("0.30");
    private static final BigDecimal DECLINED_REWARD_MODIFIER = BigDecimal.ONE;

    private final TravelPauseService travelPauseService;
    private final GameSessionWebSocketController webSocketController;
    private final Random random = new Random();

    private final Set<UUID> triggeredTravelIds = ConcurrentHashMap.newKeySet();
    private final Map<UUID, PendingTreasureHuntEvent> pendingEvents = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> rewardModifiersByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> successBonusByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, TreasureHuntSummaryState> summaryByTravelId = new ConcurrentHashMap<>();

    public TreasureHuntMinigameServiceImpl(TravelPauseService travelPauseService,
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
        PendingTreasureHuntEvent event = new PendingTreasureHuntEvent(
                eventId,
                travel.getPlayerId(),
                sessionId,
                travelId,
                travel.getPlayerShipId(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_REQUIRED_TREASURES,
                DEFAULT_PIRATE_COUNT
        );
        pendingEvents.put(travelId, event);
        travelPauseService.pauseTravel(travelId, sessionId, travel.getPlayerId(), travel.getPlayerShipId(), "TREASURE_HUNT");

        TreasureHuntMinigameEvent socketEvent = new TreasureHuntMinigameEvent(
                eventId.toString(),
                travel.getPlayerId().toString(),
                sessionId.toString(),
                travelId.toString(),
                travel.getPlayerShipId().toString(),
                DEFAULT_TIME_LIMIT_SECONDS,
                DEFAULT_REQUIRED_TREASURES,
                DEFAULT_PIRATE_COUNT
        );
        webSocketController.broadcastTreasureHuntMinigameEvent(sessionId.toString(), socketEvent);
    }

    @Override
    public TreasureHuntMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, TreasureHuntMinigameResultRequest request) {
        PendingTreasureHuntEvent event = pendingEvents.get(request.getTravelId());
        if (event == null) {
            throw new IllegalArgumentException("No pending treasure hunt minigame for this travel.");
        }
        if (!event.eventId().equals(request.getEventId())) {
            throw new IllegalArgumentException("Event id does not match pending treasure hunt minigame.");
        }
        if (!event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            throw new IllegalArgumentException("Treasure hunt result does not belong to this player/session.");
        }

        String normalizedResult = request.getResult().trim().toUpperCase(Locale.ROOT);
        if (!normalizedResult.equals("SUCCESS") && !normalizedResult.equals("FAILED") && !normalizedResult.equals("DECLINED")) {
            throw new IllegalArgumentException("Result must be SUCCESS, FAILED or DECLINED.");
        }

        pendingEvents.remove(request.getTravelId());

        BigDecimal rewardModifier;
        BigDecimal successBonus = BigDecimal.ZERO;
        int cargoLossPercent = 0;
        if (normalizedResult.equals("SUCCESS")) {
            rewardModifier = BigDecimal.ONE;
            successBonus = calculateSuccessBonus(request.getCollectedTreasures());
        } else if (normalizedResult.equals("FAILED")) {
            rewardModifier = FAILED_REWARD_MODIFIER;
            cargoLossPercent = FAILED_CARGO_LOSS_PERCENT;
        } else {
            rewardModifier = DECLINED_REWARD_MODIFIER;
        }

        rewardModifiersByTravelId.put(request.getTravelId(), rewardModifier);
        successBonusByTravelId.put(request.getTravelId(), successBonus);
        summaryByTravelId.put(request.getTravelId(), new TreasureHuntSummaryState(
                true,
                normalizedResult,
                successBonus,
                BigDecimal.ZERO,
                cargoLossPercent
        ));

        String resumeReason = switch (normalizedResult) {
            case "SUCCESS" -> "TREASURE_HUNT_SUCCESS";
            case "FAILED" -> "TREASURE_HUNT_FAILED";
            default -> "TREASURE_HUNT_DECLINED";
        };
        travelPauseService.resumeTravel(request.getTravelId(), sessionId, playerId, event.playerShipId(), resumeReason);

        return new TreasureHuntMinigameSubmitResult(
                "TREASURE_HUNT",
                normalizedResult,
                request.getCollectedTreasures(),
                request.getRequiredTreasures(),
                request.getTimeLeftSeconds(),
                request.getTimeLimitSeconds(),
                rewardModifier
        );
    }

    @Override
    public Optional<TreasureHuntMinigameEvent> getPendingEvent(UUID travelId, UUID playerId, UUID sessionId) {
        PendingTreasureHuntEvent event = pendingEvents.get(travelId);
        if (event == null || !event.playerId().equals(playerId) || !event.sessionId().equals(sessionId)) {
            return Optional.empty();
        }

        return Optional.of(new TreasureHuntMinigameEvent(
                event.eventId().toString(),
                event.playerId().toString(),
                event.sessionId().toString(),
                event.travelId().toString(),
                event.playerShipId().toString(),
                event.timeLimitSeconds(),
                event.requiredTreasures(),
                event.pirateCount()
        ));
    }

    @Override
    public BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward) {
        BigDecimal modifier = rewardModifiersByTravelId.remove(travelId);
        if (modifier == null) return totalReward;
        BigDecimal successBonus = successBonusByTravelId.remove(travelId);
        if (successBonus == null) successBonus = BigDecimal.ZERO;

        BigDecimal modified = totalReward.multiply(modifier).add(successBonus).setScale(2, RoundingMode.HALF_UP);
        BigDecimal delta = modified.subtract(totalReward).setScale(2, RoundingMode.HALF_UP);

        TreasureHuntSummaryState existing = summaryByTravelId.get(travelId);
        if (existing != null) {
            BigDecimal bonusFromDelta = delta.compareTo(BigDecimal.ZERO) > 0 ? delta : BigDecimal.ZERO;
            BigDecimal bonusAmount = existing.bonusAmount().max(bonusFromDelta).setScale(2, RoundingMode.HALF_UP);
            BigDecimal penaltyAmount = delta.compareTo(BigDecimal.ZERO) < 0
                    ? delta.abs()
                    : BigDecimal.ZERO;
            summaryByTravelId.put(travelId, new TreasureHuntSummaryState(
                    existing.triggered(),
                    existing.result(),
                    bonusAmount,
                    penaltyAmount,
                    existing.cargoLossPercent()
            ));
        }

        return modified;
    }

    private BigDecimal calculateSuccessBonus(int collectedTreasures) {
        int chests = Math.max(0, collectedTreasures);
        long bonus = 0L;
        for (int i = 0; i < chests; i++) {
            bonus += random.nextInt(SUCCESS_CHEST_BONUS_MAX - SUCCESS_CHEST_BONUS_MIN + 1) + SUCCESS_CHEST_BONUS_MIN;
        }
        return BigDecimal.valueOf(bonus).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public TreasureHuntMinigameTravelSummary consumeTravelSummary(UUID travelId) {
        TreasureHuntSummaryState summary = summaryByTravelId.remove(travelId);
        if (summary == null) {
            return new TreasureHuntMinigameTravelSummary(false, null, BigDecimal.ZERO, BigDecimal.ZERO, 0);
        }
        return new TreasureHuntMinigameTravelSummary(
                summary.triggered(),
                summary.result(),
                summary.bonusAmount(),
                summary.penaltyAmount(),
                summary.cargoLossPercent()
        );
    }

    private record PendingTreasureHuntEvent(
            UUID eventId,
            UUID playerId,
            UUID sessionId,
            UUID travelId,
            UUID playerShipId,
            int timeLimitSeconds,
            int requiredTreasures,
            int pirateCount
    ) {}

    private record TreasureHuntSummaryState(
            boolean triggered,
            String result,
            BigDecimal bonusAmount,
            BigDecimal penaltyAmount,
            int cargoLossPercent
    ) {}
}
