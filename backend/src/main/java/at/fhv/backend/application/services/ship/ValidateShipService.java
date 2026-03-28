package at.fhv.backend.application.services.ship;

import at.fhv.backend.domain.model.ship.Ship;

import java.math.BigDecimal;
import java.util.UUID;

public interface ValidateShipService {
    BigDecimal validatePurchase(Ship ship, BigDecimal playerBalance);
}
