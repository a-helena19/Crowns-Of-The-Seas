package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.domain.model.ship.Ship;
import org.springframework.stereotype.Service;

@Service
public class CalculateFuelConsumptionServiceImpl implements CalculateFuelConsumptionService {
    @Override
    public double calculateFuelConsumption(Ship ship, double distance) {
        return distance * ship.getFuelConsumption();
    }

    public static double toFuelPercent(double absoluteFuel, double maxFuel) {
        return (absoluteFuel / maxFuel) * 100.0;
    }
}
