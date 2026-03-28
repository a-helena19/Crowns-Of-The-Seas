package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.domain.model.ship.Ship;

public class CalculateFuelConsumptionServiceImpl implements CalculateFuelConsumptionService {
    @Override
    public double calculateFuelConsumption(Ship ship, double distance) {
        double absoluteConsumption = distance * ship.getFuelConsumption();
        return (absoluteConsumption / ship.getMaxFuel().doubleValue()) * 100.0;
    }
}
