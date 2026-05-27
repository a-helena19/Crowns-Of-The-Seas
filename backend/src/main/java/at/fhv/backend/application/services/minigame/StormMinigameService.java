package at.fhv.backend.application.services.minigame;

import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.minigame.request.StormMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.StormMinigameTravelSummary;

import java.math.BigDecimal;
import java.util.UUID;

public interface StormMinigameService {
    void tryTriggerForTravel(Travel travel, UUID sessionId);

    StormMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, StormMinigameResultRequest request);

    BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward);

    StormMinigameTravelSummary consumeTravelSummary(UUID travelId);

    record StormMinigameSubmitResult(
            String eventType,
            String result,
            int collectedSuns,
            int requiredSuns,
            int remainingHealth,
            int timeLeftSeconds,
            int timeLimitSeconds,
            BigDecimal repairCost
    ) {}
}
