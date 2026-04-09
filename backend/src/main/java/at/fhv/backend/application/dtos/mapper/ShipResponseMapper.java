package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.application.dtos.response.ShipDTO;
import at.fhv.backend.domain.model.ship.Ship;
import org.springframework.stereotype.Component;

@Component
public class ShipResponseMapper implements DtoMapper<Ship, ShipDTO> {
    @Override
    public ShipDTO toResponse(Ship ship) {
        ShipDTO response = new ShipDTO();
        response.setId(ship.getId());
        response.setName(ship.getName());
        response.setDescription(ship.getDescription());
        response.setShipClass(ship.getShipClass());
        response.setPrice(ship.getPrice());
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
