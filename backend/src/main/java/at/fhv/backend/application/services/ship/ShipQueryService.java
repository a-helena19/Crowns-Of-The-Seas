package at.fhv.backend.application.services.ship;

import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.dtos.response.ShipDTO;

import java.util.List;
import java.util.UUID;

public interface ShipQueryService {
    List<ShipDTO> getMarketShips();
    List<PlayerShipDTO> getPlayerShips(UUID playerId);
    PlayerShipDTO getPlayerShip(UUID playerShipId, UUID playerId);
}
