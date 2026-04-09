package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.infrastructure.persistence.ship.ShipEntity;
import org.springframework.stereotype.Component;

@Component
public class ShipMapper implements EntityMapper<Ship, ShipEntity> {
    @Override
    public ShipEntity toJpaEntity(Ship ship) {
        ShipEntity entity = new ShipEntity();
        entity.setId(ship.getId());
        entity.setName(ship.getName());
        entity.setDescription(ship.getDescription());
        entity.setShipClass(ship.getShipClass());
        entity.setPrice(ship.getPrice());
        entity.setMaxCargoCapacity(ship.getMaxCargoCapacity());
        entity.setMaxSpeed(ship.getMaxSpeed());
        entity.setFuelConsumption(ship.getFuelConsumption());
        entity.setMaxFuel(ship.getMaxFuel());
        entity.setOperatingCost(ship.getOperatingCost());
        entity.setBaseReliability(ship.getBaseReliability());
        entity.setIconUrl(ship.getIconUrl());
        return entity;
    }

    @Override
    public Ship toDomainModel(ShipEntity entity) {
        return Ship.reconstruct(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getShipClass(),
                entity.getPrice(),
                entity.getMaxCargoCapacity(),
                entity.getMaxSpeed(),
                entity.getFuelConsumption(),
                entity.getMaxFuel(),
                entity.getOperatingCost(),
                entity.getBaseReliability(),
                entity.getIconUrl()
        );
    }

}
