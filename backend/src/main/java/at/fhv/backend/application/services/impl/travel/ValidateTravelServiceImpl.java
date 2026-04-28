package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.InsufficientFuelException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ValidateTravelServiceImpl implements ValidateTravelService {

    @Override
    public void validateTravelStart(PlayerShip playerShip, Ship ship, UUID playerId,
                                    UUID originPortId, UUID destinationPortId,
                                    double requiredFuelAbsolute) {
        if (!playerShip.isOwnedBy(playerId)) {
            throw new ShipNotOwnedException("Ship is not owned by player", playerId);
        }

        if (playerShip.getStatus() != ShipStatus.LOADING) {
            throw new InvalidShipStatusTransition("Ship must be LOADING", "shipId", playerShip.getId());
        }

        if (originPortId != null && originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same origin and destination port: ", originPortId);
        }

        double availableFuelAbsolute = (playerShip.getFuel() / 100.0) * ship.getMaxFuel().doubleValue();

        if (availableFuelAbsolute < requiredFuelAbsolute) {
            double requiredPercent = (requiredFuelAbsolute / ship.getMaxFuel().doubleValue()) * 100.0;
            throw new InsufficientFuelException("Insufficient fuel", requiredPercent, playerShip.getFuel());
        }
    }
}