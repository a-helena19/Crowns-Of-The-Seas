package at.fhv.backend.domain.model.cargo.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class CargoNotAssignedException extends DomainException {
    public CargoNotAssignedException(UUID cargoId, String status) {
        super("Cargo " + cargoId + " is not assigned (status=" + status + ")", ErrorCode.CARGO_NOT_ASSIGNED);
    }
}
