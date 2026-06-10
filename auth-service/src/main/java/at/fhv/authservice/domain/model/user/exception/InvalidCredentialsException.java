package at.fhv.authservice.domain.model.user.exception;

import at.fhv.authservice.domain.model.exception.DomainException;
import at.fhv.authservice.domain.model.exception.ErrorCode;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password", ErrorCode.INVALID_CREDENTIALS);
    }
}
