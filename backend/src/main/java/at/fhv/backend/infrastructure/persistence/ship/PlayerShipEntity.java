package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.ShipStatus;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "player_ships")
public class PlayerShipEntity {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "ship_id", nullable = false)
    private UUID shipId;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipStatus status;

    @Column(nullable = false)
    private double condition;

    @Column(nullable = false)
    private double fuel;

    @Column(name = "current_port_id")
    private UUID currentPortId;

    @Column(name = "target_port_id")
    private UUID targetPortId;

    public PlayerShipEntity() {}

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

    public UUID getPlayerId() {
        return playerId;
    }

    public void setPlayerId(UUID playerId) {
        this.playerId = playerId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public ShipStatus getStatus() {
        return status;
    }

    public void setStatus(ShipStatus status) {
        this.status = status;
    }

    public double getCondition() {
        return condition;
    }

    public void setCondition(double condition) {
        this.condition = condition;
    }

    public double getFuel() {
        return fuel;
    }

    public void setFuel(double fuel) {
        this.fuel = fuel;
    }

    public UUID getCurrentPortId() {
        return currentPortId;
    }

    public void setCurrentPortId(UUID currentPortId) {
        this.currentPortId = currentPortId;
    }

    public UUID getTargetPortId() {
        return targetPortId;
    }

    public void setTargetPortId(UUID targetPortId) {
        this.targetPortId = targetPortId;
    }
}