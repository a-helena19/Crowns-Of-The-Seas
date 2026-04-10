package at.fhv.backend.application.services.travel;

import at.fhv.backend.application.dtos.request.StartTravelDTO;
import at.fhv.backend.application.dtos.response.TravelDTO;

import java.util.List;
import java.util.UUID;

public interface StartTravelService {
    TravelDTO startTravel(UUID playerId, UUID sessionId, StartTravelDTO request);
    List<TravelDTO> getActiveTravels(UUID playerId);
    TravelDTO getTravelStatus(UUID travelId, UUID playerId);
}
