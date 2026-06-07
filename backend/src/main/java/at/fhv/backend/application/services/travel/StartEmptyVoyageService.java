package at.fhv.backend.application.services.travel;

import at.fhv.backend.rest.dtos.ship.request.StartEmptyVoyageDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;

import java.util.UUID;

public interface StartEmptyVoyageService {
    TravelDTO startEmptyVoyage(UUID playerId, UUID sessionId, StartEmptyVoyageDTO request);
}
