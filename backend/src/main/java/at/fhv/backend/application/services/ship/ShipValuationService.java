package at.fhv.backend.application.services.ship;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;

import java.math.BigDecimal;

public interface ShipValuationService {
    BigDecimal calculateCurrentShipValue(Ship ship, PlayerShip playerShip);
}
