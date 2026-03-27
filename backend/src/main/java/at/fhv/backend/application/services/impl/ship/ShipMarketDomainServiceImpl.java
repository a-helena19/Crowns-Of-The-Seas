package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.services.ship.ShipMarketDomainService;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.ship.Ship;

import java.math.BigDecimal;
import java.util.UUID;

public class ShipMarketDomainServiceImpl implements ShipMarketDomainService {
    public void validateAndExecutePurchase(Ship ship, UUID playerId, BigDecimal playerBalance) {
        if (playerBalance.compareTo(ship.getPrice()) < 0) {
            throw new InsufficientFundsException(ship.getPrice(), playerBalance);
        }
    }
}
