package at.fhv.backend.domain.model.exception;

import at.fhv.backend.domain.model.travel.TravelStatus;

public class InvalidTravelStateException extends DomainException {
    private final TravelStatus status;

    public InvalidTravelStateException(String message, TravelStatus status) {
        super(message, ErrorCode.TRAVEL_INVALID_STATE);
        this.status = status;
    }

    public TravelStatus getStatus() {
        return status;
    }
}
