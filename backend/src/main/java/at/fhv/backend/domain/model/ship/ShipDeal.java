package at.fhv.backend.domain.model.ship;

import java.util.UUID;

public class ShipDeal {
    private final UUID id;
    private final UUID sessionId;
    private final UUID shipId;
    private final double baseDiscountPercent;
    private final int createdTick;
    private final int expiryTick;
    private int remainingQuantity;

    public ShipDeal(UUID sessionId, UUID shipId, double baseDiscountPercent,
                    int quantity, int createdTick, int expiryTick) {
        this.id = UUID.randomUUID();
        this.sessionId = sessionId;
        this.shipId = shipId;
        this.baseDiscountPercent = baseDiscountPercent;
        this.remainingQuantity = quantity;
        this.createdTick = createdTick;
        this.expiryTick = expiryTick;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getShipId() {
        return shipId;
    }

    public double getBaseDiscountPercent() {
        return baseDiscountPercent;
    }

    public int getCreatedTick() {
        return createdTick;
    }

    public int getExpiryTick() {
        return expiryTick;
    }

    public int getRemainingQuantity() {
        return remainingQuantity;
    }

    public boolean isExpired(int currentTick) {
        return currentTick >= expiryTick;
    }

    public boolean isAvailable(int currentTick) {
        return remainingQuantity > 0 && !isExpired(currentTick);
    }

    public synchronized boolean tryClaim(int currentTick) {
        if (!isAvailable(currentTick)) {
            return false;
        }
        remainingQuantity--;
        return true;
    }
}