package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class InvalidTravelDataException extends DomainException {
    private final String field;
    private final UUID id;

    public InvalidTravelDataException(String message, String field, UUID id) {
        super(message, ErrorCode.TRAVEL_INVALID_DATA);
        this.field = field;
        this.id = id;
    }

    public String getField() {
        return field;
    }

    public UUID getId() {
        return id;
    }
}
