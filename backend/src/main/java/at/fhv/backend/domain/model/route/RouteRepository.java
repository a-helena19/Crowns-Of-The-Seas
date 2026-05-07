package at.fhv.backend.domain.model.route;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteRepository {
    Route save(Route route);
    Optional<Route> findById(RouteId id);
    Optional<Route> findByPorts(UUID originPortId, UUID destinationPortId);
    List<Route> findAll();
    boolean existsBetween(UUID portIdA, UUID portIdB);
}

