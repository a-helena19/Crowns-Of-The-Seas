package at.fhv.backend.application.services.ship;

import at.fhv.backend.rest.dtos.ship.response.RepairResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.RepairQuoteDTO;

import java.util.UUID;

public interface RepairShipService {
    RepairQuoteDTO getRepairQuote(UUID playerShipId, UUID playerId, UUID sessionId);

    RepairResponseDTO repair(UUID playerShipId, UUID playerId, UUID sessionId);
}
