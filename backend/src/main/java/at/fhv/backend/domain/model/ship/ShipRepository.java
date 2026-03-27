package at.fhv.backend.domain.model.ship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShipRepository {
    Ship save(Ship ship);
    Optional<Ship> findById(UUID id);
    List<Ship> findByOwnerId(UUID playerId);
    List<Ship> findByStatus(ShipStatus status);
    default List<Ship> findAvailableOnMarket() {
        return findByStatus(ShipStatus.AT_MARKET);
    }
}
