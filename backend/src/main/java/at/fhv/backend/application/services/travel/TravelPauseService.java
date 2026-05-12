package at.fhv.backend.application.services.travel;

import java.util.UUID;

public interface TravelPauseService {
    void pauseTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason);
    void resumeTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason);
    boolean isTravelPaused(UUID travelId);
}
