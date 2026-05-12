package at.fhv.backend.domain.model.cargo.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class CargoNotFoundException extends DomainException {
    private UUID cargoId;

    public CargoNotFoundException(UUID cargoId) {
        super("Cargo not found: " + cargoId, ErrorCode.CARGO_NOT_FOUND);
    }

    public UUID getCargoId() {
        return cargoId;
    }
}
