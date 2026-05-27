package at.fhv.backend.application.services.minigame;

import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.minigame.request.ObstacleMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.ObstacleMinigameTravelSummary;

import java.math.BigDecimal;
import java.util.UUID;

public interface ObstacleMinigameService {
    void tryTriggerForTravel(Travel travel, UUID sessionId);

    ObstacleMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, ObstacleMinigameResultRequest request);

    BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward);

    ObstacleMinigameTravelSummary consumeTravelSummary(UUID travelId);

    record ObstacleMinigameSubmitResult(
            String eventType,
            String result,
            int remainingHealth,
            int timeLeftSeconds,
            int timeLimitSeconds,
            String failureReason,
            String routeViewType,
            BigDecimal rewardModifier
    ) {}
}
