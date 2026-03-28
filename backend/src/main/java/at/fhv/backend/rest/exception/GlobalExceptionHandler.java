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
            case SHIP_NOT_FOUND,
                 TRAVEL_NOT_FOUND -> HttpStatus.NOT_FOUND;

            case PLAYER_INSUFFICIENT_FUNDS,
                 INSUFFICIENT_FUEL,
                 SHIP_NOT_AVAILABLE_FOR_PURCHASE,
                 SHIP_NOT_OWNED_BY_PLAYER -> HttpStatus.BAD_REQUEST;

            case SHIP_INVALID_STATUS_TRANSITION,
                 TRAVEL_INVALID_STATE,
                 TRAVEL_INVALID_DATA,
                 TRAVEL_SAME_PORT -> HttpStatus.CONFLICT;

            default -> HttpStatus.BAD_REQUEST;
        };
    }
}
