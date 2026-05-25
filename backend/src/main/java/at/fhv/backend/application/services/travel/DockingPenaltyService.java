package at.fhv.backend.application.services.travel;

import java.util.UUID;

public interface DockingPenaltyService {
    void applyArrivalFailurePenalty(UUID travelId, UUID playerId, UUID sessionId);

    void applyDepartureFailurePenalty(UUID travelId, UUID playerId, UUID sessionId);
}
