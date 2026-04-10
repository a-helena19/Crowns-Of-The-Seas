package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.math.BigDecimal;

public class InvalidAmountException extends DomainException {
    public InvalidAmountException(BigDecimal amount) {
        super("Amount " + amount + " is invalid, must be greater than 0",
                ErrorCode.INVALID_AMOUNT);
    }
}
