package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.infrastructure.persistence.ship.PlayerShipEntity;
import org.springframework.stereotype.Component;

@Component
public class PlayerShipMapper implements EntityMapper<PlayerShip, PlayerShipEntity> {
    @Override
    public PlayerShipEntity toJpaEntity(PlayerShip playerShip) {
        PlayerShipEntity entity = new PlayerShipEntity();
        entity.setId(playerShip.getId());
        entity.setShipId(playerShip.getShipId());
        entity.setPlayerId(playerShip.getPlayerId());
        entity.setStatus(playerShip.getStatus());
        entity.setCondition(playerShip.getCondition());
        entity.setFuel(playerShip.getFuel());
        entity.setCurrentPortId(playerShip.getCurrentPortId());
        entity.setTargetPortId(playerShip.getTargetPortId());
        return entity;
    }

    @Override
    public PlayerShip toDomainModel(PlayerShipEntity entity) {
        return PlayerShip.reconstruct(
                entity.getId(),
                entity.getShipId(),
                entity.getPlayerId(),
                entity.getStatus(),
                entity.getCondition(),
                entity.getFuel(),
                entity.getCurrentPortId(),
                entity.getTargetPortId()
        );
    }
}
