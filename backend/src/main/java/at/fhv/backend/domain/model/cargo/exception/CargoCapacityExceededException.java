package at.fhv.backend.domain.model.cargo.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class CargoCapacityExceededException extends DomainException {
    private final int shipCapacity;
    private final int cargoCapacity;


    public CargoCapacityExceededException(int shipCapacity, int cargoCapacity) {
        super("Dein Schiff hat zu wenig Ladekapazität (" + shipCapacity
                + ") für diese Fracht (benötigt " + cargoCapacity + ").", ErrorCode.CARGO_CAPACITY_EXCEEDED);
        this.shipCapacity = shipCapacity;
        this.cargoCapacity = cargoCapacity;
    }

    public int getShipCapacity() {
        return shipCapacity;
    }

    public int getCargoCapacity() {
        return cargoCapacity;
    }
}
