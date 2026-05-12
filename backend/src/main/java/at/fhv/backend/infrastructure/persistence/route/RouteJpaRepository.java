package at.fhv.backend.infrastructure.persistence.route;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RouteJpaRepository extends JpaRepository<RouteEntity, UUID> {
    Optional<RouteEntity> findByOriginPortIdAndDestinationPortId(UUID originPortId, UUID destinationPortId);
    boolean existsByOriginPortIdAndDestinationPortId(UUID originPortId, UUID destinationPortId);
}

