package at.fhv.backend.application.services.minigame;

import at.fhv.backend.rest.dtos.minigame.request.RatMinigameResultRequest;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.websocket.RatMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.RatMinigameTravelSummary;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface RatMinigameService {
    void tryTriggerForTravel(Travel travel, UUID sessionId);

    RatMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, RatMinigameResultRequest request);

    Optional<RatMinigameEvent> getPendingEvent(UUID travelId, UUID playerId, UUID sessionId);

    BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward);

    RatMinigameTravelSummary consumeTravelSummary(UUID travelId);

    record RatMinigameSubmitResult(
            String eventType,
            String result,
            int hits,
            int requiredHits,
            int remainingSeconds,
            int timeLimitSeconds,
            BigDecimal rewardModifier
    ) {}
}
