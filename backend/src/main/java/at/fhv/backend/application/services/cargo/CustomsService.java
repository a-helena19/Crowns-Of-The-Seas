package at.fhv.backend.application.services.cargo;

import at.fhv.backend.domain.model.customs.CustomsInspection;
import at.fhv.backend.domain.model.travel.Travel;

import java.util.UUID;

public interface CustomsService {
    CustomsInspection inspectOnArrival(Travel travel);
    void cooperate(UUID playerId, UUID inspectionId);
    CustomsInspection bribe(UUID playerId, UUID inspectionId);
    CustomsInspection peekByTravelId(UUID travelId);
    CustomsInspection consumeInspection(UUID travelId);
    boolean isAwaitingDecision(UUID travelId);
    int getBlockExpirationTick(UUID travelId);
    void clearBlockTracking(UUID travelId);
}
