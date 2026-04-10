package at.fhv.backend.domain.model.user.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password", ErrorCode.INVALID_CREDENTIALS);
    }
}
