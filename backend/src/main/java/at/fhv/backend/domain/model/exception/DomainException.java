package at.fhv.backend.domain.model.exception;

public abstract class DomainException extends RuntimeException {
    private final ErrorCode errorCode;

    public DomainException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
