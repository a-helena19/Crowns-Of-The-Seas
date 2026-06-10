package at.fhv.backend.application.services.travel;

import at.fhv.backend.rest.dtos.ship.response.FuelEstimateDTO;

import java.util.UUID;

public interface FuelEstimateService {
    FuelEstimateDTO estimate(UUID playerId, UUID sessionId, UUID playerShipId, UUID sessionCargoId);
    FuelEstimateDTO estimateForPort(UUID playerId, UUID sessionId, UUID playerShipId, UUID destinationPortId);
}

