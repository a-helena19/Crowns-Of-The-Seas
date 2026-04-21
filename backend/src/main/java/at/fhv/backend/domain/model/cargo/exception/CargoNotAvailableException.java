package at.fhv.backend.domain.model.cargo.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class CargoNotAvailableException extends DomainException {
    private UUID sessionCargoId;

    public CargoNotAvailableException(UUID sessionCargoId) {
        super("Cargo offer is no longer available (already taken or inactive for" + sessionCargoId, ErrorCode.CARGO_NOT_AVAILABLE);
    }

    public UUID getSessionCargoId() {
        return sessionCargoId;
    }
}
