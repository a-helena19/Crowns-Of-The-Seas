package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.services.ship.ValidateShipService;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.ship.Ship;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ValidateShipServiceImpl implements ValidateShipService {
    @Override
    public void validateAndExecutePurchase(Ship ship, UUID playerId, BigDecimal playerBalance) {
        if (playerBalance.compareTo(ship.getPrice()) < 0) {
            throw new InsufficientFundsException(ship.getPrice(), playerBalance);
        }
        // ship.purchase(playerId);
    }

    @Override
    public BigDecimal validatePurchase(Ship ship, BigDecimal playerBalance) {
        if (playerBalance.compareTo(ship.getPrice()) < 0) {
            throw new InsufficientFundsException(ship.getPrice(), playerBalance);
        }
        return ship.getPrice();
    }
}
