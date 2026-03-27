package at.fhv.backend.application.services.ship;

import at.fhv.backend.domain.model.ship.Ship;

import java.math.BigDecimal;
import java.util.UUID;

public interface ShipMarketDomainService {
    void validateAndExecutePurchase(Ship ship, UUID playerId, BigDecimal playerBalance);
}
