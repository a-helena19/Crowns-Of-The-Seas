package at.fhv.backend.port.domain.repository;

import at.fhv.backend.port.domain.model.Port;
import at.fhv.backend.port.domain.model.PortId;

import java.util.List;
import java.util.Optional;

public interface PortRepository {
    Port save(Port port);
    Optional<Port> findById(PortId id);
    List<Port> findAll();
    boolean existsById(PortId id);
}
