package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class ShipNotAvailableException extends DomainException {
    private final String field;
    private final UUID id;

    public ShipNotAvailableException(String message, String field, UUID id) {
        super(message, ErrorCode.SHIP_NOT_AVAILABLE_FOR_PURCHASE);
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
