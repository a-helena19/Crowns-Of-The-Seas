package at.fhv.backend.rest.dtos.ship.response;

import at.fhv.backend.domain.model.ship.ShipClass;

import java.math.BigDecimal;
import java.util.UUID;

public class ShipDTO {
    private UUID id;
    private String name;
    private String description;
    private ShipClass shipClass;
    private BigDecimal price;
    private int maxCargoCapacity;
    private double maxSpeed;
    private double fuelConsumption;
    private BigDecimal maxFuel;
    private BigDecimal operatingCost;
    private double baseReliability;
    private String iconUrl;
    private int stock;
    private int availableStock;

    public ShipDTO(){}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public int getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(int availableStock) {
        this.availableStock = availableStock;
    }
}