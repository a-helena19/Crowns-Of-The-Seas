package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.request.BuyShipDTO;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;

import java.math.BigDecimal;
import java.util.UUID;

public interface PurchaseShipService {
    PlayerShipDTO buyShip(UUID playerId, UUID sessionId, BuyShipDTO request);
    BigDecimal getBalanceByPlayerId(UUID playerId, UUID sessionId);
}
