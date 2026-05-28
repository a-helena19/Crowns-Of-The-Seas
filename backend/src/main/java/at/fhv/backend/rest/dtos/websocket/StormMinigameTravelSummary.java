package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class StormMinigameTravelSummary {
    private final boolean triggered;
    private final String result;
    private final BigDecimal penaltyAmount;
    private final int cargoLossPercent;
    private final double conditionDamagePercent;

    public StormMinigameTravelSummary(boolean triggered, String result, BigDecimal penaltyAmount,
                                      int cargoLossPercent, double conditionDamagePercent) {
        this.triggered = triggered;
        this.result = result;
        this.penaltyAmount = penaltyAmount != null ? penaltyAmount : BigDecimal.ZERO;
        this.cargoLossPercent = cargoLossPercent;
        this.conditionDamagePercent = conditionDamagePercent;
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

    public int getCargoLossPercent() {
        return cargoLossPercent;
    }

    public double getConditionDamagePercent() {
        return conditionDamagePercent;
    }
}
