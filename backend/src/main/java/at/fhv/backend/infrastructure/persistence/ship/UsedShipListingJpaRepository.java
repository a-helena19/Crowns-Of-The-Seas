package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.UsedShipListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsedShipListingJpaRepository extends JpaRepository<UsedShipListingEntity, UUID> {
    Optional<UsedShipListingEntity> findByIdAndSessionId(UUID id, UUID sessionId);
    List<UsedShipListingEntity> findAllBySessionIdAndStatus(UUID sessionId, UsedShipListingStatus status);
    long countByShipIdAndSessionIdAndStatus(UUID shipId, UUID sessionId, UsedShipListingStatus status);
}
