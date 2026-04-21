package at.fhv.backend.application.services.travel;

import at.fhv.backend.rest.dtos.ship.response.TravelDurationEstimateDTO;

import java.util.UUID;

public interface TravelDurationEstimateService {
    TravelDurationEstimateDTO estimate(UUID playerId, UUID sessionId, UUID playerShipId, UUID sessionCargoId);
}
