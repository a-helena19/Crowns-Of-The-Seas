package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.ship.PlayerShip;

import java.util.UUID;

public interface ValidateTravelService {
    void validateTravelStart(PlayerShip playerShip, UUID playerId, UUID originPortId, UUID destinationPortId, double requiredFuelPercent);
}
