package at.fhv.backend.domain.model.cargo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CargoRepository {
    Cargo save(Cargo cargo);
    Optional<Cargo> findById(UUID id);
    List<Cargo> findAll();
}
