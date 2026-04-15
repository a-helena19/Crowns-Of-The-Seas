package at.fhv.backend.application.services.travel;

import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;

import java.util.List;
import java.util.UUID;

public interface StartTravelService {
    TravelDTO startTravel(UUID playerId, UUID sessionId, StartTravelDTO request);
    List<TravelDTO> getActiveTravels(UUID playerId);
    TravelDTO getTravelStatus(UUID travelId, UUID playerId);
}
