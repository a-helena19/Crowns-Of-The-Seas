package at.fhv.backend.application.services.travel;

import java.util.Optional;
import java.util.UUID;

public interface TravelPauseService {
    void pauseTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason);
    void pauseTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason, String eventId);

    void resumeTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason);
    boolean isTravelPaused(UUID travelId);
    Integer getPausedAtTick(UUID travelId);

    Optional<BlockingEvent> getBlockingEvent(UUID travelId);

    record BlockingEvent(String reason, String eventId) {}
}
