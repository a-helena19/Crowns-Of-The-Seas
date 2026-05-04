package at.fhv.backend.infrastructure.persistence.route;


import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.route.Route;
import at.fhv.backend.domain.model.route.RouteId;
import at.fhv.backend.domain.model.route.RouteRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class RouteRepositoryImpl implements RouteRepository {
    private final RouteJpaRepository jpaRepository;

    public RouteRepositoryImpl(RouteJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Route save(Route route) {
        RouteEntity entity = toEntity(route);
        RouteEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Route> findById(RouteId id) {
        return jpaRepository.findById(id.getValue()).map(this::toDomain);
    }

    @Override
    public Optional<Route> findByPorts(UUID originPortId, UUID destinationPortId) {
        Optional<RouteEntity> direct = jpaRepository.findByOriginPortIdAndDestinationPortId(originPortId, destinationPortId);
        if (direct.isPresent()) {
            return direct.map(this::toDomain);
        }
        Optional<RouteEntity> reversed = jpaRepository.findByOriginPortIdAndDestinationPortId(destinationPortId, originPortId);
        return reversed.map(this::toDomainReversed);
    }

    @Override
    public List<Route> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsBetween(UUID portIdA, UUID portIdB) {
        return jpaRepository.existsByOriginPortIdAndDestinationPortId(portIdA, portIdB)
                || jpaRepository.existsByOriginPortIdAndDestinationPortId(portIdB, portIdA);
    }

    private RouteEntity toEntity(Route route) {
        RouteEntity e = new RouteEntity();
        e.setId(route.getId().getValue());
        e.setOriginPortId(route.getOriginPortId());
        e.setDestinationPortId(route.getDestinationPortId());
        e.setDistance(route.getDistance());
        List<WaypointEmbeddable> wps = new ArrayList<>();
        for (Coordinates c : route.getWaypoints()) {
            wps.add(new WaypointEmbeddable(c.getX(), c.getY()));
        }
        e.setWaypoints(wps);
        return e;
    }

    private Route toDomain(RouteEntity e) {
        List<Coordinates> wps = new ArrayList<>();
        for (WaypointEmbeddable w : e.getWaypoints()) {
            wps.add(Coordinates.of(w.getX(), w.getY()));
        }
        return Route.reconstruct(
                RouteId.of(e.getId()),
                e.getOriginPortId(),
                e.getDestinationPortId(),
                wps,
                e.getDistance()
        );
    }

    private Route toDomainReversed(RouteEntity e) {
        List<Coordinates> wps = new ArrayList<>();
        for (WaypointEmbeddable w : e.getWaypoints()) {
            wps.add(Coordinates.of(w.getX(), w.getY()));
        }
        Collections.reverse(wps);
        return Route.reconstruct(
                RouteId.of(e.getId()),
                e.getDestinationPortId(),
                e.getOriginPortId(),
                wps,
                e.getDistance()
        );
    }
}

