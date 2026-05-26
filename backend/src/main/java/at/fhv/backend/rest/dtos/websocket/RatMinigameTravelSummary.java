package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class RatMinigameTravelSummary {
    private final boolean triggered;
    private final String result;
    private final BigDecimal penaltyAmount;

    public RatMinigameTravelSummary(boolean triggered, String result, BigDecimal penaltyAmount) {
        this.triggered = triggered;
        this.result = result;
        this.penaltyAmount = penaltyAmount;
    }

    public boolean isTriggered() {
        return triggered;
    }

    public String getResult() {
        return result;
    }

    public BigDecimal getPenaltyAmount() {
        return penaltyAmount;
    }
}
