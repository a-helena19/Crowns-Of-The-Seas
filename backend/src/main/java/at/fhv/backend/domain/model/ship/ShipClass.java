package at.fhv.backend.domain.model.ship;

import java.math.BigDecimal;

public enum ShipClass {
    BUDGET(new BigDecimal("15000")),
    STANDARD(new BigDecimal("45000")),
    PREMIUM(new BigDecimal("50000"));

    private final BigDecimal maxPrice;

    ShipClass(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }
}
