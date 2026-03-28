package at.fhv.backend.domain.model.ship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlayerShipRepository {
    PlayerShip save(PlayerShip playerShip);
    Optional<PlayerShip> findById(UUID id);
    List<PlayerShip> findAllByPlayerId(UUID playerId);
    List<PlayerShip> findAllByPlayerIdAndStatus(UUID playerId, ShipStatus status);
}
