package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;

import java.util.UUID;

public interface ValidateTravelService {
    void validateTravelStart(PlayerShip playerShip, Ship ship, UUID playerId,
                             UUID originPortId, UUID destinationPortId,
                             double requiredFuelAbsolute);

}
