package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class SamePortException extends DomainException {
    private final UUID originPortId;

    public SamePortException(String message, UUID originPortId) {
        super(String.format("Same origin and destination port %s", originPortId),
                ErrorCode.TRAVEL_SAME_PORT);
        this.originPortId = originPortId;
    }

    public UUID getOriginPortId() {
        return originPortId;
    }
}
