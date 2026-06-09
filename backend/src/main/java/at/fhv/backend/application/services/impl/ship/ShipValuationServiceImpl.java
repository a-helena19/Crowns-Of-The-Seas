package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.services.ship.ShipValuationService;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ShipValuationServiceImpl implements ShipValuationService {
    private static final BigDecimal SELL_BASE_FACTOR = BigDecimal.valueOf(0.70);
    private static final BigDecimal CONDITION_WEIGHT = BigDecimal.valueOf(0.80);
    private static final BigDecimal FUEL_WEIGHT = BigDecimal.valueOf(0.20);

    @Override
    public BigDecimal calculateCurrentShipValue(Ship ship, PlayerShip playerShip) {
        BigDecimal conditionFactor = BigDecimal.valueOf(playerShip.getCondition())
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                .multiply(CONDITION_WEIGHT);
        BigDecimal fuelFactor = BigDecimal.valueOf(playerShip.getFuel())
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                .multiply(FUEL_WEIGHT);

        return ship.getPrice()
                .multiply(SELL_BASE_FACTOR)
                .multiply(conditionFactor.add(fuelFactor))
                .setScale(0, RoundingMode.HALF_UP);
    }
}
