package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.UsedShipListing;
import at.fhv.backend.domain.model.ship.UsedShipListingRepository;
import at.fhv.backend.domain.model.ship.UsedShipListingStatus;
import at.fhv.backend.infrastructure.mapper.UsedShipListingMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public class UsedShipListingRepositoryImpl implements UsedShipListingRepository {
    private final UsedShipListingJpaRepository jpaRepository;
    private final UsedShipListingMapper mapper;

    public UsedShipListingRepositoryImpl(UsedShipListingJpaRepository jpaRepository, UsedShipListingMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public UsedShipListing save(UsedShipListing listing) {
        return mapper.toDomainModel(jpaRepository.save(mapper.toJpaEntity(listing)));
    }

    @Override
    public Optional<UsedShipListing> findByIdAndSessionId(UUID id, UUID sessionId) {
        return jpaRepository.findByIdAndSessionId(id, sessionId).map(mapper::toDomainModel);
    }

    @Override
    public List<UsedShipListing> findAllBySessionIdAndStatus(UUID sessionId, UsedShipListingStatus status) {
        return jpaRepository.findAllBySessionIdAndStatus(sessionId, status)
                .stream()
                .map(mapper::toDomainModel)
                .toList();
    }

    @Override
    public long countByShipIdAndSessionIdAndStatus(UUID shipId, UUID sessionId, UsedShipListingStatus status) {
        return jpaRepository.countByShipIdAndSessionIdAndStatus(shipId, sessionId, status);
    }
}
