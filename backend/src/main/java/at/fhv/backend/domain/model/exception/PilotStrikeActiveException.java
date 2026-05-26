package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class PilotStrikeActiveException extends DomainException {
    private final UUID portId;

    public PilotStrikeActiveException(String message, UUID portId) {
        super(message, ErrorCode.PILOT_STRIKE_ACTIVE);
        this.portId = portId;
    }

    public UUID getPortId() {
        return portId;
    }
}
