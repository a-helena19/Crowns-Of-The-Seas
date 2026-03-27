package at.fhv.backend.domain.model.exception;

import java.math.BigDecimal;

public class InsufficientFundsException extends DomainException {
    private BigDecimal price;
    private BigDecimal playerBalance;

    public InsufficientFundsException(BigDecimal price, BigDecimal playerBalance) {
        super(String.format("Insufficient funds. Required: %s, Available: %s", price, playerBalance),
                ErrorCode.PLAYER_INSUFFICIENT_FUNDS
        );
        this.price = price;
        this.playerBalance = playerBalance;
    }
}
