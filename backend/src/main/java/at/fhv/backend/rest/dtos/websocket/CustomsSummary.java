package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class CustomsSummary {
    private String outcome;
    private BigDecimal finePaid;
    private BigDecimal bribePaid;
    private boolean bribeAttempted;
    private boolean detained;
    private int detentionTicks;
    private boolean wasCarryingIllegalCargo;

    public CustomsSummary(String outcome, BigDecimal finePaid, BigDecimal bribePaid,
                          boolean bribeAttempted, boolean detained, int detentionTicks,
                          boolean wasCarryingIllegalCargo) {
        this.outcome = outcome;
        this.finePaid = finePaid;
        this.bribePaid = bribePaid;
        this.bribeAttempted = bribeAttempted;
        this.detained = detained;
        this.detentionTicks = detentionTicks;
        this.wasCarryingIllegalCargo = wasCarryingIllegalCargo;
    }

    public String getOutcome() {
        return outcome;
    }

    public BigDecimal getFinePaid() {
        return finePaid;
    }

    public BigDecimal getBribePaid() {
        return bribePaid;
    }

    public boolean isBribeAttempted() {
        return bribeAttempted;
    }

    public boolean isDetained() {
        return detained;
    }

    public int getDetentionTicks() {
        return detentionTicks;
    }

    public boolean isWasCarryingIllegalCargo() {
        return wasCarryingIllegalCargo;
    }
}