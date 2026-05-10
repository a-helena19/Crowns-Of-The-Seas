package at.fhv.backend.domain.model.ship;

import java.math.BigDecimal;
import java.util.UUID;

public class UsedShipListing {
    private final UUID id;
    private final UUID shipId;
    private final UUID sessionId;
    private final UUID sellerPlayerId;
    private final BigDecimal price;
    private final double fuel;
    private final double condition;
    private final UUID currentPortId;
    private UsedShipListingStatus status;

    private UsedShipListing(UUID id, UUID shipId, UUID sessionId, UUID sellerPlayerId, BigDecimal price,
                            double fuel, double condition, UUID currentPortId, UsedShipListingStatus status) {
        this.id = id;
        this.shipId = shipId;
        this.sessionId = sessionId;
        this.sellerPlayerId = sellerPlayerId;
        this.price = price;
        this.fuel = fuel;
        this.condition = condition;
        this.currentPortId = currentPortId;
        this.status = status;
    }

    public static UsedShipListing create(UUID shipId, UUID sessionId, UUID sellerPlayerId, BigDecimal price,
                                         double fuel, double condition, UUID currentPortId) {
        return new UsedShipListing(UUID.randomUUID(), shipId, sessionId, sellerPlayerId, price, fuel, condition,
                currentPortId, UsedShipListingStatus.AVAILABLE);
    }

    public static UsedShipListing reconstruct(UUID id, UUID shipId, UUID sessionId, UUID sellerPlayerId,
                                              BigDecimal price, double fuel, double condition, UUID currentPortId,
                                              UsedShipListingStatus status) {
        return new UsedShipListing(id, shipId, sessionId, sellerPlayerId, price, fuel, condition, currentPortId, status);
    }

    public void markSold() {
        this.status = UsedShipListingStatus.SOLD;
    }

    public UUID getId() {
        return id;
    }

    public UUID getShipId() {
        return shipId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getSellerPlayerId() {
        return sellerPlayerId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public double getFuel() {
        return fuel;
    }

    public double getCondition() {
        return condition;
    }

    public UUID getCurrentPortId() {
        return currentPortId;
    }

    public UsedShipListingStatus getStatus() {
        return status;
    }
}
