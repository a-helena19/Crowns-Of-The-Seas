package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.ship.UsedShipListing;
import at.fhv.backend.infrastructure.persistence.ship.UsedShipListingEntity;
import org.springframework.stereotype.Component;

@Component
public class UsedShipListingMapper implements EntityMapper<UsedShipListing, UsedShipListingEntity> {
    @Override
    public UsedShipListingEntity toJpaEntity(UsedShipListing listing) {
        UsedShipListingEntity entity = new UsedShipListingEntity();
        entity.setId(listing.getId());
        entity.setShipId(listing.getShipId());
        entity.setSessionId(listing.getSessionId());
        entity.setSellerPlayerId(listing.getSellerPlayerId());
        entity.setPrice(listing.getPrice());
        entity.setFuel(listing.getFuel());
        entity.setCondition(listing.getCondition());
        entity.setCurrentPortId(listing.getCurrentPortId());
        entity.setStatus(listing.getStatus());
        return entity;
    }

    @Override
    public UsedShipListing toDomainModel(UsedShipListingEntity entity) {
        return UsedShipListing.reconstruct(
                entity.getId(),
                entity.getShipId(),
                entity.getSessionId(),
                entity.getSellerPlayerId(),
                entity.getPrice(),
                entity.getFuel(),
                entity.getCondition(),
                entity.getCurrentPortId(),
                entity.getStatus()
        );
    }
}
