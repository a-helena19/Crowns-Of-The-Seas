package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class RegressSummary {
    private final int delayTicks;
    private final int toleranceTicks;
    private final int overdueTicks;
    private final BigDecimal delayComponent;
    private final BigDecimal damageComponent;
    private final BigDecimal cargoLossComponent;
    private final double cargoLossPercent;
    private final double damagePercent;
    private final double specialCargoMultiplier;
    private final boolean hadPerishableCargo;
    private final boolean hadFragileCargo;
    private final BigDecimal totalFine;

    public RegressSummary(int delayTicks, int toleranceTicks, int overdueTicks,
                          BigDecimal delayComponent, BigDecimal damageComponent,
                          BigDecimal cargoLossComponent, double cargoLossPercent,
                          double damagePercent, double specialCargoMultiplier,
                          boolean hadPerishableCargo, boolean hadFragileCargo,
                          BigDecimal totalFine) {
        this.delayTicks = delayTicks;
        this.toleranceTicks = toleranceTicks;
        this.overdueTicks = overdueTicks;
        this.delayComponent = delayComponent;
        this.damageComponent = damageComponent;
        this.cargoLossComponent = cargoLossComponent;
        this.cargoLossPercent = cargoLossPercent;
        this.damagePercent = damagePercent;
        this.specialCargoMultiplier = specialCargoMultiplier;
        this.hadPerishableCargo = hadPerishableCargo;
        this.hadFragileCargo = hadFragileCargo;
        this.totalFine = totalFine;
    }

    public int getDelayTicks() {
        return delayTicks;
    }

    public int getToleranceTicks() {
        return toleranceTicks;
    }

    public int getOverdueTicks() {
        return overdueTicks;
    }

    public BigDecimal getDelayComponent() {
        return delayComponent;
    }

    public BigDecimal getDamageComponent() {
        return damageComponent;
    }

    public BigDecimal getCargoLossComponent() {
        return cargoLossComponent;
    }

    public double getCargoLossPercent() {
        return cargoLossPercent;
    }

    public double getDamagePercent() {
        return damagePercent;
    }

    public double getSpecialCargoMultiplier() {
        return specialCargoMultiplier;
    }

    public boolean isHadPerishableCargo() {
        return hadPerishableCargo;
    }

    public boolean isHadFragileCargo() {
        return hadFragileCargo;
    }

    public BigDecimal getTotalFine() {
        return totalFine;
    }
}
