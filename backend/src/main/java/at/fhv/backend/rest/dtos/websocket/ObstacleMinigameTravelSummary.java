package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class ObstacleMinigameTravelSummary {
    private final boolean triggered;
    private final String result;
    private final BigDecimal penaltyAmount;
    private final int cargoLossPercent;
    private final double conditionDamagePercent;
    private final String failureReason;
    private final String routeViewType;

    public ObstacleMinigameTravelSummary(boolean triggered, String result, BigDecimal penaltyAmount,
                                         int cargoLossPercent, double conditionDamagePercent,
                                         String failureReason, String routeViewType) {
        this.triggered = triggered;
        this.result = result;
        this.penaltyAmount = penaltyAmount != null ? penaltyAmount : BigDecimal.ZERO;
        this.cargoLossPercent = cargoLossPercent;
        this.conditionDamagePercent = conditionDamagePercent;
        this.failureReason = failureReason;
        this.routeViewType = routeViewType;
    }

    public boolean isTriggered() { return triggered; }
    public String getResult() { return result; }
    public BigDecimal getPenaltyAmount() { return penaltyAmount; }
    public int getCargoLossPercent() { return cargoLossPercent; }
    public double getConditionDamagePercent() { return conditionDamagePercent; }
    public String getFailureReason() { return failureReason; }
    public String getRouteViewType() { return routeViewType; }
}
