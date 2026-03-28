package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.InsufficientFuelException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.ShipStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ValidateTravelServiceImpl implements ValidateTravelService {
    @Override
    public void validateTravelStart(PlayerShip playerShip, UUID playerId, UUID originPortId, UUID destinationPortId, double requiredFuelPercent) {
        if (!playerShip.isOwnedBy(playerId)) {
            throw new ShipNotOwnedException("Ship is not owned by player", playerId);
        }

        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be AT_PORT", "shipId", playerShip.getId());
        }

        if (originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same origin and destination port: ", originPortId);
        }

        if (playerShip.getFuel() < requiredFuelPercent) {
            throw new InsufficientFuelException("Insufficient fuel", requiredFuelPercent, playerShip.getFuel());
        }
    }
}
