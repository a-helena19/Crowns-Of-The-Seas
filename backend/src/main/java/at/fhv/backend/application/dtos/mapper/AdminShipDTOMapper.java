package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
import org.springframework.stereotype.Component;

@Component
public class AdminShipDTOMapper implements DtoMapper<Ship, AdminShipDTO> {

    @Override
    public AdminShipDTO toResponse(Ship ship) {
        return new AdminShipDTO(
                ship.getId(),
                ship.getName(),
                ship.getDescription(),
                ship.getShipClass().name(),
                ship.getPrice(),
                ship.getMaxCargoCapacity(),
                ship.getMaxSpeed(),
                ship.getFuelConsumption(),
                ship.getMaxFuel(),
                ship.getOperatingCost(),
                ship.getBaseReliability(),
                ship.getIconUrl(),
                ship.getStock()
        );
    }

    public Ship toDomain(AdminShipDTO dto) {
        return Ship.create(
                dto.name(), dto.description(),
                ShipClass.valueOf(dto.shipClass()),
                dto.price(), dto.maxCargoCapacity(), dto.maxSpeed(),
                dto.fuelConsumption(), dto.maxFuel(),
                dto.operatingCost(), dto.baseReliability(),
                dto.iconUrl(), dto.stock()
        );
    }

    public Ship toDomainWithId(AdminShipDTO dto) {
        return Ship.reconstruct(
                dto.id(), dto.name(), dto.description(),
                ShipClass.valueOf(dto.shipClass()),
                dto.price(), dto.maxCargoCapacity(), dto.maxSpeed(),
                dto.fuelConsumption(), dto.maxFuel(),
                dto.operatingCost(), dto.baseReliability(),
                dto.iconUrl(), dto.stock()
        );
    }
}