package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.ship.Ship;

public interface CalculateFuelConsumptionService {
    double calculateFuelConsumption(Ship ship, double distance);
}
