package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class OnlyHostCanStartException extends DomainException {
    public OnlyHostCanStartException(UUID userId) {
        super("User " + userId + " is not the host",
                ErrorCode.ONLY_HOST_CAN_START);
    }
}
