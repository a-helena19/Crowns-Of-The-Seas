package at.fhv.backend.domain.model.cargo.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class CargoCapacityExceededException extends DomainException {
    private int shipCapacity;
    private int cargoCapacity;


    public CargoCapacityExceededException(int shipCapacity, int cargoCapacity) {
        super("Ship capacity " + shipCapacity + " is insufficient for cargo" + cargoCapacity, ErrorCode.CARGO_CAPACITY_EXCEEDED);
    }

    public int getShipCapacity() {
        return shipCapacity;
    }

    public int getCargoCapacity() {
        return cargoCapacity;
    }
}
