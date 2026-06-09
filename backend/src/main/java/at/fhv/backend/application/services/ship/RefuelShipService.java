package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.RefuelResponseDTO;

import java.util.UUID;

public interface RefuelShipService {
    RefuelResponseDTO refuel(UUID playerShipId, UUID playerId, UUID sessionId, double targetFuelPercent);
}
