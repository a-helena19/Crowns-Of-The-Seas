package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.ShipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlayerShipJpaRepository extends JpaRepository<PlayerShipEntity, UUID> {
    List<PlayerShipEntity> findAllByPlayerId(UUID playerId);
    List<PlayerShipEntity> findAllByPlayerIdAndSessionId(UUID playerId, UUID sessionId);
    List<PlayerShipEntity> findAllByPlayerIdAndSessionIdAndStatus(UUID playerId, UUID sessionId, ShipStatus status);
    Optional<PlayerShipEntity> findByIdAndPlayerIdAndSessionId(UUID id, UUID playerId, UUID sessionId);
}
