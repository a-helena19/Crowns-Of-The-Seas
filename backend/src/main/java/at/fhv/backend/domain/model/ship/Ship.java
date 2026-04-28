package at.fhv.backend.domain.model.ship;

import java.math.BigDecimal;
import java.util.UUID;

public class Ship {
    private final UUID id;
    private final String name;
    private final String description;
    private final ShipClass shipClass;
    private final BigDecimal price;
    private final int maxCargoCapacity;
    private final double maxSpeed;
    private final double fuelConsumption;
    private final BigDecimal maxFuel;
    private final BigDecimal operatingCost;
    private final double baseReliability;
    private final String iconUrl;
    private final int stock;

    private Ship(UUID id, String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                 double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability, String iconUrl, int stock) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.shipClass = shipClass;
        this.price = price;
        this.maxCargoCapacity = maxCargoCapacity;
        this.maxSpeed = maxSpeed;
        this.fuelConsumption = fuelConsumption;
        this.maxFuel = maxFuel;
        this.operatingCost = operatingCost;
        this.baseReliability = baseReliability;
        this.iconUrl = iconUrl;
        this.stock = stock;
    }

    public static Ship create(String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                              double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability, String iconUrl, int stock) {
        return new Ship(
                UUID.randomUUID(),
                name, description,
                shipClass,
                price,
                maxCargoCapacity,
                maxSpeed,
                fuelConsumption,
                maxFuel,
                operatingCost,
                baseReliability,
                iconUrl,
                stock);
    }

    public static Ship reconstruct(UUID id, String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                                   double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability, String iconUrl, int stock) {
        return new Ship(
                id,
                name,
                description,
                shipClass,
                price,
                maxCargoCapacity,
                maxSpeed,
                fuelConsumption,
                maxFuel,
                operatingCost,
                baseReliability,
                iconUrl,
                stock
        );
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public ShipClass getShipClass() {
        return shipClass;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getMaxCargoCapacity() {
        return maxCargoCapacity;
    }

    public double getMaxSpeed() {
        return maxSpeed;
    }

    public double getFuelConsumption() {
        return fuelConsumption;
    }

    public BigDecimal getMaxFuel() {
        return maxFuel;
    }

    public BigDecimal getOperatingCost() {
        return operatingCost;
    }

    public double getBaseReliability() {
        return baseReliability;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public int getStock() {
        return stock;
    }
}