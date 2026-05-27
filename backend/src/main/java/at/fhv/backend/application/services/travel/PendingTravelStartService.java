package at.fhv.backend.application.services.travel;

import java.util.UUID;

public interface PendingTravelStartService {
    void finalizePlannedTravel(UUID travelId);
    void cancelPlannedTravel(UUID travelId);
}
