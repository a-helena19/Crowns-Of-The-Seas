package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class InvalidTickRateException extends DomainException {
    public InvalidTickRateException(int tickRate) {
        super("Tick rate " + tickRate + " is not valid. Must be between 1 and 60",
                ErrorCode.INVALID_TICK_RATE);
    }
}