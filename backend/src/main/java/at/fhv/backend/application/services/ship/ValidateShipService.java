package at.fhv.backend.application.services.ship;

import at.fhv.backend.domain.model.ship.Ship;

import java.math.BigDecimal;
import java.util.UUID;

public interface ValidateShipService {
    void validateAndExecutePurchase(Ship ship, UUID playerId, BigDecimal playerBalance);
    BigDecimal validatePurchase(Ship ship, BigDecimal playerBalance);
}
