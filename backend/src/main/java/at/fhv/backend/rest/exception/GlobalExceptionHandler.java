package at.fhv.backend.rest.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(DomainException exception) {
        HttpStatus status = mapToHttpStatus(exception);

        ErrorResponse response = new ErrorResponse(
                exception.getMessage(),
                exception.getErrorCode().name()
        );
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse response = new ErrorResponse(
                "Unexpected error occurred",
                "INTERNAL_SERVER_ERROR"
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private HttpStatus mapToHttpStatus(DomainException exception) {
        return switch (exception.getErrorCode()) {

            case PLAYER_NOT_FOUND, SESSION_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case FACTION_ALREADY_ASSIGNED -> HttpStatus.CONFLICT;
            case INVALID_FACTION,
                 PLAYER_INSUFFICIENT_FUNDS,
                 INVALID_AMOUNT,
                 SESSION_NOT_IN_LOBBY,
                 SESSION_NOT_RUNNING,
                 INVALID_TICK_RATE -> HttpStatus.BAD_REQUEST;

            case SESSION_FULL,
                 ONLY_HOST_CAN_START -> HttpStatus.FORBIDDEN;

        };
    }
}
