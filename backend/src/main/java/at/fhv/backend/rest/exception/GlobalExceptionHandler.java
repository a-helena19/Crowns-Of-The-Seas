package at.fhv.backend.rest.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "Validation failed";
        ErrorResponse response = new ErrorResponse(
                message,
                "VALIDATION_ERROR"
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
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
            case PLAYER_INSUFFICIENT_FUNDS,
                 INSUFFICIENT_FUEL,
                 SHIP_NOT_AVAILABLE_FOR_PURCHASE,
                 SHIP_NOT_OWNED_BY_PLAYER,
                 CARGO_NOT_AVAILABLE,
                 SMUGGLE_EXPIRED,
                 CARGO_NOT_ASSIGNED,
                 CARGO_CAPACITY_EXCEEDED,
                 INVALID_FACTION,
                 INVALID_AMOUNT,
                 SESSION_NOT_IN_LOBBY,
                 SESSION_NOT_RUNNING,
                 INVALID_TICK_RATE,
                 CUSTOMS_INSPECTION_INVALID_STATE,
                 HOME_PORT_NOT_ASSIGNED,
                 PILOT_STRIKE_ACTIVE -> HttpStatus.BAD_REQUEST;

            case PLAYER_NOT_FOUND,
                 SESSION_NOT_FOUND,
                 SHIP_NOT_FOUND,
                 TRAVEL_NOT_FOUND,
                 CARGO_NOT_FOUND,
                 SMUGGLE_NOT_FOUND,
                 CUSTOMS_INSPECTION_NOT_FOUND -> HttpStatus.NOT_FOUND;

            case SHIP_INVALID_STATUS_TRANSITION,
                 TRAVEL_INVALID_STATE,
                 TRAVEL_INVALID_DATA,
                 TRAVEL_SAME_PORT,
                 FACTION_ALREADY_ASSIGNED,
                 HOME_PORT_ALREADY_ASSIGNED,
                 SESSION_FULL,
                 ONLY_HOST_CAN_START,
                 PLAYER_ALREADY_IN_SESSION -> HttpStatus.CONFLICT;

        };

    }
}
