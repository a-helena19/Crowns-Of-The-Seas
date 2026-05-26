package at.fhv.backend.domain.model.ship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShipRepository {
    Ship save(Ship ship);
    Optional<Ship> findById(UUID id);
    List<Ship> findAllAvailableOnMarket();
    List<Ship> findAll();
    void deleteById(UUID id);
}
