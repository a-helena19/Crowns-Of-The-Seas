package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.ShipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlayerShipJpaRepository extends JpaRepository<PlayerShipEntity, UUID> {
    List<PlayerShipEntity> findAllByPlayerId(UUID playerId);
    List<PlayerShipEntity> findAllByPlayerIdAndStatus(UUID playerId, ShipStatus status);
}
