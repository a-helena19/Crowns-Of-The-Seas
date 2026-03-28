package at.fhv.backend.application.services.ship;

import at.fhv.backend.application.dtos.request.BuyShipDTO;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import java.util.UUID;

public interface PurchaseShipService {
    PlayerShipDTO buyShip(UUID playerId, BuyShipDTO request);
}
