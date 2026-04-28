package at.fhv.backend.infrastructure.persistence.cargo;


import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "session_cargos")
public class SessionCargoEntity {
    @Id @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "cargo_id", nullable = false)
    private UUID cargoId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "origin_port_id", nullable = false)
    private UUID originPortId;

    @Column(name = "destination_port_id", nullable = false)
    private UUID destinationPortId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal reward;

    @Column(name = "contains_illegal", nullable = false)
    private boolean containsIllegal;

    @Column(nullable = false)
    private int capacity;

    @Enumerated(EnumType.STRING) @Column(name = "cargo_type", nullable = false)
    private CargoType cargoType;

    @Column(nullable = false)
    private double risk;

    @Enumerated(EnumType.STRING)
    @Column(name = "cargo_status", nullable = false)
    private CargoStatus cargoStatus;

    @Column(name = "assigned_player_id")
    private UUID assignedPlayerId;

    @Column(name = "assigned_player_ship_id")
    private UUID assignedPlayerShipId;

    @Column(name = "spawn_tick", nullable = false)
    private int spawnTick;

    @Column(name = "cooldown_until_tick", nullable = false)
    private int cooldownUntilTick;

    @Column(name = "expires_at_tick", nullable = false)
    private int expiresAtTick;

    @Column(name = "loading_completed_at_tick")
    private int loadingCompletedAtTick = -1;

    public SessionCargoEntity() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCargoId() {
        return cargoId;
    }

    public void setCargoId(UUID cargoId) {
        this.cargoId = cargoId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getOriginPortId() {
        return originPortId;
    }

    public void setOriginPortId(UUID originPortId) {
        this.originPortId = originPortId;
    }

    public UUID getDestinationPortId() {
        return destinationPortId;
    }

    public void setDestinationPortId(UUID destinationPortId) {
        this.destinationPortId = destinationPortId;
    }

    public BigDecimal getReward() {
        return reward;
    }

    public void setReward(BigDecimal reward) {
        this.reward = reward;
    }

    public boolean isContainsIllegal() {
        return containsIllegal;
    }

    public void setContainsIllegal(boolean containsIllegal) {
        this.containsIllegal = containsIllegal;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public CargoType getCargoType() {
        return cargoType;
    }

    public void setCargoType(CargoType cargoType) {
        this.cargoType = cargoType;
    }

    public double getRisk() {
        return risk;
    }

    public void setRisk(double risk) {
        this.risk = risk;
    }

    public CargoStatus getCargoStatus() {
        return cargoStatus;
    }

    public void setCargoStatus(CargoStatus cargoStatus) {
        this.cargoStatus = cargoStatus;
    }

    public UUID getAssignedPlayerId() {
        return assignedPlayerId;
    }

    public void setAssignedPlayerId(UUID assignedPlayerId) {
        this.assignedPlayerId = assignedPlayerId;
    }

    public UUID getAssignedPlayerShipId() {
        return assignedPlayerShipId;
    }

    public void setAssignedPlayerShipId(UUID assignedPlayerShipId) {
        this.assignedPlayerShipId = assignedPlayerShipId;
    }

    public int getSpawnTick() {
        return spawnTick;
    }

    public void setSpawnTick(int spawnTick) {
        this.spawnTick = spawnTick;
    }

    public int getCooldownUntilTick() {
        return cooldownUntilTick;
    }

    public void setCooldownUntilTick(int cooldownUntilTick) {
        this.cooldownUntilTick = cooldownUntilTick;
    }

    public int getExpiresAtTick() {
        return expiresAtTick;
    }

    public void setExpiresAtTick(int expiresAtTick) {
        this.expiresAtTick = expiresAtTick;
    }

    public int getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }

    public void setLoadingCompletedAtTick(int loadingCompletedAtTick) {
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }
}