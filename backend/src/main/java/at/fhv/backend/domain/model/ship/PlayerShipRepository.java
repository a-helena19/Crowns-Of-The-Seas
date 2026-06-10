package at.fhv.backend.domain.model.ship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlayerShipRepository {
    PlayerShip save(PlayerShip playerShip);
    void deleteById(UUID id);

    Optional<PlayerShip> findById(UUID id);

    Optional<PlayerShip> findByIdAndPlayerIdAndSessionId(
            UUID id,
            UUID playerId,
            UUID sessionId
    );

    List<PlayerShip> findAllByPlayerIdAndSessionId(UUID playerId, UUID sessionId);
    List<PlayerShip> findAllBySessionId(UUID sessionId);

    List<PlayerShip> findAllByPlayerIdAndSessionIdAndStatus(
            UUID playerId,
            UUID sessionId,
            ShipStatus status
    );

    long countByShipIdAndSessionId(UUID shipId, UUID sessionId);

    List<PlayerShip> saveAll(List<PlayerShip> ships);
}