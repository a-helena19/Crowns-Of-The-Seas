package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class TreasureHuntMinigameTravelSummary {
    private final boolean triggered;
    private final String result;
    private final BigDecimal bonusAmount;
    private final BigDecimal penaltyAmount;
    private final int cargoLossPercent;

    public TreasureHuntMinigameTravelSummary(boolean triggered, String result, BigDecimal bonusAmount, BigDecimal penaltyAmount,
                                             int cargoLossPercent) {
        this.triggered = triggered;
        this.result = result;
        this.bonusAmount = bonusAmount != null ? bonusAmount : BigDecimal.ZERO;
        this.penaltyAmount = penaltyAmount != null ? penaltyAmount : BigDecimal.ZERO;
        this.cargoLossPercent = cargoLossPercent;
    }

    public boolean isTriggered() {
        return triggered;
    }

    public String getResult() {
        return result;
    }

    public BigDecimal getBonusAmount() {
        return bonusAmount;
    }

    public BigDecimal getPenaltyAmount() {
        return penaltyAmount;
    }

    public int getCargoLossPercent() {
        return cargoLossPercent;
    }
}
