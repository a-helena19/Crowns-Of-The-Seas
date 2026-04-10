package at.fhv.backend.domain.model.exception;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password", ErrorCode.INVALID_CREDENTIALS);
    }
}
