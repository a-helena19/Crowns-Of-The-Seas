package at.fhv.backend.infrastructure.mapper;


import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.infrastructure.persistence.cargo.SessionCargoEntity;
import org.springframework.stereotype.Component;

@Component
public class SessionCargoMapper implements EntityMapper<SessionCargo, SessionCargoEntity> {
    @Override
    public SessionCargoEntity toJpaEntity(SessionCargo sc) {
        SessionCargoEntity e = new SessionCargoEntity();
        e.setId(sc.getId());
        e.setCargoId(sc.getCargoId());
        e.setSessionId(sc.getSessionId());
        e.setOriginPortId(sc.getOriginPortId());
        e.setDestinationPortId(sc.getDestinationPortId());
        e.setReward(sc.getReward());
        e.setContainsIllegal(sc.isContainsIllegal());
        e.setCapacity(sc.getCapacity());
        e.setCargoType(sc.getCargoType());
        e.setRisk(sc.getRisk());
        e.setCargoStatus(sc.getCargoStatus());
        e.setAssignedPlayerId(sc.getAssignedPlayerId());
        e.setAssignedPlayerShipId(sc.getAssignedPlayerShipId());
        e.setSpawnTick(sc.getSpawnTick());
        e.setCooldownUntilTick(sc.getCooldownUntilTick());
        e.setExpiresAtTick(sc.getExpiresAtTick());
        return e;
    }

    @Override
    public SessionCargo toDomainModel(SessionCargoEntity e) {
        return SessionCargo.reconstruct(
                e.getId(), e.getCargoId(), e.getSessionId(),
                e.getOriginPortId(), e.getDestinationPortId(),
                e.getReward(), e.isContainsIllegal(), e.getCapacity(),
                e.getCargoType(), e.getRisk(), e.getCargoStatus(),
                e.getAssignedPlayerId(), e.getAssignedPlayerShipId(),
                e.getSpawnTick(), e.getCooldownUntilTick(), e.getExpiresAtTick()
        );
    }
}