package at.fhv.backend.domain.model.ship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsedShipListingRepository {
    UsedShipListing save(UsedShipListing listing);
    Optional<UsedShipListing> findByIdAndSessionId(UUID id, UUID sessionId);
    List<UsedShipListing> findAllBySessionIdAndStatus(UUID sessionId, UsedShipListingStatus status);
    long countByShipIdAndSessionIdAndStatus(UUID shipId, UUID sessionId, UsedShipListingStatus status);
}
