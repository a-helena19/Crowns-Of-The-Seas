package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.RefuelResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.RefuelQuoteDTO;

import java.util.UUID;

public interface RefuelShipService {
    RefuelQuoteDTO getRefuelQuote(UUID playerShipId, UUID playerId, UUID sessionId, double targetFuelPercent);

    RefuelResponseDTO refuel(UUID playerShipId, UUID playerId, UUID sessionId, double targetFuelPercent);
}
