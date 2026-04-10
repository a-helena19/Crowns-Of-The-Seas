package at.fhv.backend.application.services.ship;

import at.fhv.backend.application.dtos.request.BuyShipDTO;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;

import java.math.BigDecimal;
import java.util.UUID;

public interface PurchaseShipService {
    PlayerShipDTO buyShip(UUID playerId, UUID sessionId, BuyShipDTO request);
    BigDecimal getBalanceByPlayerId(UUID playerId, UUID sessionId);
}
