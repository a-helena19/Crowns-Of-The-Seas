package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class TravelNotFoundException extends DomainException {
    private final UUID travelId;
    public TravelNotFoundException(String message, UUID travelId) {
        super(message, ErrorCode.TRAVEL_NOT_FOUND);
        this.travelId = travelId;
    }

    public UUID getTravelId() {
        return travelId;
    }
}
