package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.travel.Travel;

import java.util.UUID;

public interface UnloadingStartService {
    void startUnloadingImmediately(Travel travel);
    void startUnloadingAfterCustomsCheck(UUID travelId);
    void startUnloadingAfterDetention(UUID travelId);
    int computeUnloadingTicks(Travel travel);
}
