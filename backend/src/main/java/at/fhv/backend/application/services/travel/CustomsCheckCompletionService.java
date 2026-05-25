package at.fhv.backend.application.services.travel;

import java.util.UUID;

public interface CustomsCheckCompletionService {
    void completeCustomsCheck(UUID travelId);
}
