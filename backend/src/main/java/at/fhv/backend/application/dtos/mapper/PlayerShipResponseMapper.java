package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;
import org.springframework.stereotype.Component;

@Component
public class PlayerShipResponseMapper {
    public PlayerShipDTO toResponse(PlayerShip playerShip, Ship ship) {
        PlayerShipDTO response = new PlayerShipDTO();
        response.setId(playerShip.getId());
        response.setShipId(playerShip.getShipId());
        response.setPlayerId(playerShip.getPlayerId());
        response.setStatus(playerShip.getStatus());
        response.setCondition(playerShip.getCondition());
        response.setFuel(playerShip.getFuel());
        response.setCurrentPortId(playerShip.getCurrentPortId());
        response.setTargetPortId(playerShip.getTargetPortId());

        response.setName(ship.getName());
        response.setDescription(ship.getDescription());
        response.setShipClass(ship.getShipClass());
        response.setMaxCargoCapacity(ship.getMaxCargoCapacity());
        response.setMaxSpeed(ship.getMaxSpeed());
        response.setFuelConsumption(ship.getFuelConsumption());
        response.setMaxFuel(ship.getMaxFuel());
        response.setOperatingCost(ship.getOperatingCost());
        response.setBaseReliability(ship.getBaseReliability());
        response.setIconUrl(ship.getIconUrl());

        return response;
    }
}