package at.fhv.backend.domain.model.customs;

import java.math.BigDecimal;

public class RegressFine {
    private final int delayTicks;
    private final int toleranceTicks;
    private final BigDecimal delayComponent;
    private final BigDecimal damageComponent;
    private final double damagePercent;
    private final double specialCargoMultiplier;
    private final boolean hadPerishableCargo;
    private final boolean hadFragileCargo;
    private final BigDecimal totalFine;

    public RegressFine(int delayTicks, int toleranceTicks,
                       BigDecimal delayComponent, BigDecimal damageComponent,
                       double damagePercent, double specialCargoMultiplier,
                       boolean hadPerishableCargo, boolean hadFragileCargo) {
        this.delayTicks = Math.max(0, delayTicks);
        this.toleranceTicks = Math.max(0, toleranceTicks);
        this.delayComponent = delayComponent == null ? BigDecimal.ZERO : delayComponent;
        this.damageComponent = damageComponent == null ? BigDecimal.ZERO : damageComponent;
        this.damagePercent = Math.max(0.0, damagePercent);
        this.specialCargoMultiplier = specialCargoMultiplier <= 0 ? 1.0 : specialCargoMultiplier;
        this.hadPerishableCargo = hadPerishableCargo;
        this.hadFragileCargo = hadFragileCargo;
        this.totalFine = this.delayComponent.add(this.damageComponent);
    }

    public static RegressFine none() {
        return new RegressFine(0, 0, BigDecimal.ZERO, BigDecimal.ZERO,
                0.0, 1.0, false, false);
    }

    public boolean hasFine() {
        return totalFine.compareTo(BigDecimal.ZERO) > 0;
    }

    public int getDelayTicks() {
        return delayTicks;
    }

    public int getToleranceTicks() {
        return toleranceTicks;
    }


    public int getOverdueTicks() {
        return Math.max(0, delayTicks - toleranceTicks);
    }

    public BigDecimal getDelayComponent() {
        return delayComponent;
    }

    public BigDecimal getDamageComponent() {
        return damageComponent;
    }

    public double getDamagePercent() {
        return damagePercent;
    }

    public double getSpecialCargoMultiplier() {
        return specialCargoMultiplier;
    }

    public boolean hadPerishableCargo() {
        return hadPerishableCargo;
    }

    public boolean hadFragileCargo() {
        return hadFragileCargo;
    }

    public BigDecimal getTotalFine() {
        return totalFine;
    }
}