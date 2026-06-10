package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.ShipDealDTO;

import java.util.List;
import java.util.UUID;

public interface ShipDealService {
    List<ShipDealDTO> getDealsForPlayer(UUID playerId, UUID sessionId);
    PlayerShipDTO buyDeal(UUID dealId, UUID playerId, UUID sessionId);
}
