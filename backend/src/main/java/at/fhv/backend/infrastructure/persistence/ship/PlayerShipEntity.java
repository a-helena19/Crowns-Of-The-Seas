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

    @Column(name = "loading_completed_at_tick")
    private Integer loadingCompletedAtTick;

    @Column(name = "unloading_completed_at_tick")
    private Integer unloadingCompletedAtTick;

    @Column(name = "refueling_completed_at_tick")
    private Integer refuelingCompletedAtTick;

    @Column(name = "repairing_completed_at_tick")
    private Integer repairingCompletedAtTick;

    @Column(name = "customs_check_completed_at_tick")
    private Integer customsCheckCompletedAtTick;

    @Column(name = "customs_blocked_until_tick")
    private Integer customsBlockedUntilTick;

    @Column(name = "pending_fuel_amount")
    private Double pendingFuelAmount;

    @Column(name = "pending_repair_amount")
    private Double pendingRepairAmount;

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

    public Integer getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }

    public void setLoadingCompletedAtTick(Integer loadingCompletedAtTick) {
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public Integer getUnloadingCompletedAtTick() {
        return unloadingCompletedAtTick;
    }

    public void setUnloadingCompletedAtTick(Integer unloadingCompletedAtTick) {
        this.unloadingCompletedAtTick = unloadingCompletedAtTick;
    }

    public Integer getRefuelingCompletedAtTick() {
        return refuelingCompletedAtTick;
    }
    public void setRefuelingCompletedAtTick(Integer refuelingCompletedAtTick) {
        this.refuelingCompletedAtTick = refuelingCompletedAtTick;
    }

    public Integer getRepairingCompletedAtTick() {
        return repairingCompletedAtTick;
    }
    public void setRepairingCompletedAtTick(Integer repairingCompletedAtTick) {
        this.repairingCompletedAtTick = repairingCompletedAtTick;
    }

    public Integer getCustomsCheckCompletedAtTick() {
        return customsCheckCompletedAtTick;
    }

    public void setCustomsCheckCompletedAtTick(Integer customsCheckCompletedAtTick) {
        this.customsCheckCompletedAtTick = customsCheckCompletedAtTick;
    }

    public Integer getCustomsBlockedUntilTick() {
        return customsBlockedUntilTick;
    }

    public void setCustomsBlockedUntilTick(Integer customsBlockedUntilTick) {
        this.customsBlockedUntilTick = customsBlockedUntilTick;
    }

    public Double getPendingFuelAmount() {
        return pendingFuelAmount;
    }
    public void setPendingFuelAmount(Double pendingFuelAmount) {
        this.pendingFuelAmount = pendingFuelAmount;
    }

    public Double getPendingRepairAmount() {
        return pendingRepairAmount;
    }
    public void setPendingRepairAmount(Double pendingRepairAmount) {
        this.pendingRepairAmount = pendingRepairAmount;
    }
}