package at.fhv.backend.domain.model.port;

import java.util.List;
import java.util.Optional;

public interface PortRepository {
    Port save(Port port);
    Optional<Port> findById(PortId id);
    List<Port> findAll();
    boolean existsById(PortId id);
}
