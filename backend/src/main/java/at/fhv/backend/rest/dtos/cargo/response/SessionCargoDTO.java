package at.fhv.backend.rest.dtos.cargo.response;

import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;

import java.math.BigDecimal;
import java.util.UUID;

public class SessionCargoDTO {
    private UUID id;
    private UUID cargoId;
    private UUID sessionId;
    private UUID originPortId;
    private UUID destinationPortId;
    private String originPortName;
    private String destinationPortName;
    private BigDecimal reward;
    private boolean containsIllegal;
    private int capacity;
    private CargoType cargoType;
    private double risk;
    private CargoStatus cargoStatus;
    private int spawnTick;
    private int expiresAtTick;
    private String name;
    private String description;

    public SessionCargoDTO() {}

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

    public String getOriginPortName() {
        return originPortName;
    }

    public void setOriginPortName(String originPortName) {
        this.originPortName = originPortName;
    }

    public String getDestinationPortName() {
        return destinationPortName;
    }

    public void setDestinationPortName(String destinationPortName) {
        this.destinationPortName = destinationPortName;
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

    public int getSpawnTick() {
        return spawnTick;
    }

    public void setSpawnTick(int spawnTick) {
        this.spawnTick = spawnTick;
    }

    public int getExpiresAtTick() {
        return expiresAtTick;
    }

    public void setExpiresAtTick(int expiresAtTick) {
        this.expiresAtTick = expiresAtTick;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}