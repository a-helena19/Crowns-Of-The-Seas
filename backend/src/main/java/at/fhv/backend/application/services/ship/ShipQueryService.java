package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.ShipDTO;

import java.util.List;
import java.util.UUID;

public interface ShipQueryService {
    List<ShipDTO> getMarketShips(String shipClass);
    List<PlayerShipDTO> getPlayerShips(UUID playerId, UUID sessionId);
    PlayerShipDTO getPlayerShip(UUID playerShipId, UUID playerId, UUID sessionId);
}
