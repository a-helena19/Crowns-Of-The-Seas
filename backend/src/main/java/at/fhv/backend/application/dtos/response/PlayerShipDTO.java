package at.fhv.backend.application.dtos.response;

import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipStatus;

import java.math.BigDecimal;
import java.util.UUID;

public class PlayerShipDTO {
    private UUID id;
    private UUID shipId;
    private UUID playerId;
    private ShipStatus status;
    private double condition;
    private double fuel;
    private UUID currentPortId;
    private UUID targetPortId;
    private String name;
    private String description;
    private ShipClass shipClass;
    private int maxCargoCapacity;
    private double maxSpeed;
    private double fuelConsumption;
    private BigDecimal maxFuel;
    private BigDecimal operatingCost;
    private double baseReliability;
    private String iconUrl;

    public PlayerShipDTO() {}

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

    public ShipClass getShipClass() {
        return shipClass;
    }

    public void setShipClass(ShipClass shipClass) {
        this.shipClass = shipClass;
    }

    public int getMaxCargoCapacity() {
        return maxCargoCapacity;
    }

    public void setMaxCargoCapacity(int maxCargoCapacity) {
        this.maxCargoCapacity = maxCargoCapacity;
    }

    public double getMaxSpeed() {
        return maxSpeed;
    }

    public void setMaxSpeed(double maxSpeed) {
        this.maxSpeed = maxSpeed;
    }

    public double getFuelConsumption() {
        return fuelConsumption;
    }

    public void setFuelConsumption(double fuelConsumption) {
        this.fuelConsumption = fuelConsumption;
    }

    public BigDecimal getMaxFuel() {
        return maxFuel;
    }

    public void setMaxFuel(BigDecimal maxFuel) {
        this.maxFuel = maxFuel;
    }

    public BigDecimal getOperatingCost() {
        return operatingCost;
    }

    public void setOperatingCost(BigDecimal operatingCost) {
        this.operatingCost = operatingCost;
    }

    public double getBaseReliability() {
        return baseReliability;
    }

    public void setBaseReliability(double baseReliability) {
        this.baseReliability = baseReliability;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }
}
