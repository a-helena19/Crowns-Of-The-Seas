package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipQuoteDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.UsedShipListingDTO;

import java.util.List;
import java.util.UUID;

public interface UsedShipMarketService {
    SellShipQuoteDTO getSellQuote(UUID playerShipId, UUID playerId, UUID sessionId);
    SellShipResponseDTO sellShip(UUID playerShipId, UUID playerId, UUID sessionId);
    List<UsedShipListingDTO> getAvailableUsedShips(UUID sessionId);
    PlayerShipDTO buyUsedShip(UUID listingId, UUID playerId, UUID sessionId);
}
