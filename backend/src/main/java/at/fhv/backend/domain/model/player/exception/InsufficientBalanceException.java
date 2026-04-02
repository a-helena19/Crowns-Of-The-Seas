package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.math.BigDecimal;
import java.util.UUID;

public class InsufficientBalanceException extends DomainException {
    public InsufficientBalanceException(UUID userId, BigDecimal amount) {
        super("Player " + userId + " has insufficient balance for amount " + amount,
                ErrorCode.PLAYER_INSUFFICIENT_FUNDS);
    }
}
