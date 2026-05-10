package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.UsedShipListingStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "used_ship_listings")
public class UsedShipListingEntity {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "ship_id", nullable = false)
    private UUID shipId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "seller_player_id", nullable = false)
    private UUID sellerPlayerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private double fuel;

    @Column(nullable = false)
    private double condition;

    @Column(name = "current_port_id", nullable = false)
    private UUID currentPortId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UsedShipListingStatus status;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getShipId() {
        return shipId;
    }

    public void setShipId(UUID shipId) {
        this.shipId = shipId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getSellerPlayerId() {
        return sellerPlayerId;
    }

    public void setSellerPlayerId(UUID sellerPlayerId) {
        this.sellerPlayerId = sellerPlayerId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public double getFuel() {
        return fuel;
    }

    public void setFuel(double fuel) {
        this.fuel = fuel;
    }

    public double getCondition() {
        return condition;
    }

    public void setCondition(double condition) {
        this.condition = condition;
    }

    public UUID getCurrentPortId() {
        return currentPortId;
    }

    public void setCurrentPortId(UUID currentPortId) {
        this.currentPortId = currentPortId;
    }

    public UsedShipListingStatus getStatus() {
        return status;
    }

    public void setStatus(UsedShipListingStatus status) {
        this.status = status;
    }
}
