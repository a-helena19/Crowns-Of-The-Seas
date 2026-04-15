package at.fhv.backend.domain.model.exception;

public class InsufficientFuelException extends DomainException {
    private final double requiredFuelPercent;
    private final double fuel;

    public InsufficientFuelException(String message, double requiredFuelPercent, double fuel) {
        super(String.format("Not enough fuel. Required %.1f%%, Available: %.1f%%", requiredFuelPercent, fuel ), ErrorCode.INSUFFICIENT_FUEL);
        this.requiredFuelPercent = requiredFuelPercent;
        this.fuel = fuel;
    }

    public double getRequiredFuelPercent() {
        return requiredFuelPercent;
    }

    public double getFuel() {
        return fuel;
    }
}
