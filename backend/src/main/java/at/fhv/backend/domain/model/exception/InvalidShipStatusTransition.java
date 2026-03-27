package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class InvalidShipStatusTransition extends DomainException {
    private final String field;
    private final UUID id;

    public InvalidShipStatusTransition(String message, String field, UUID id) {
        super(message, ErrorCode.SHIP_INVALID_STATUS_TRANSITION);
        this.field = field;
        this.id = id;
    }
}
