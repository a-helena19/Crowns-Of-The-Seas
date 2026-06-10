package at.fhv.backend.application.services.minigame;

import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.minigame.request.TreasureHuntMinigameResultRequest;
import at.fhv.backend.rest.dtos.websocket.TreasureHuntMinigameEvent;
import at.fhv.backend.rest.dtos.websocket.TreasureHuntMinigameTravelSummary;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface TreasureHuntMinigameService {
    void tryTriggerForTravel(Travel travel, UUID sessionId);

    TreasureHuntMinigameSubmitResult submitResult(UUID playerId, UUID sessionId, TreasureHuntMinigameResultRequest request);

    Optional<TreasureHuntMinigameEvent> getPendingEvent(UUID travelId, UUID playerId, UUID sessionId);

    BigDecimal applyRewardModifier(UUID travelId, BigDecimal totalReward);

    TreasureHuntMinigameTravelSummary consumeTravelSummary(UUID travelId);

    record TreasureHuntMinigameSubmitResult(
            String eventType,
            String result,
            int collectedTreasures,
            int requiredTreasures,
            int timeLeftSeconds,
            int timeLimitSeconds,
            BigDecimal rewardModifier
    ) {}
}
