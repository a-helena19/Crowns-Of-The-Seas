package at.fhv.backend.domain.model.ship;

import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.ShipNotAvailableException;

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

    private Ship(UUID id, String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                 double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability) {
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
    }

    public static Ship create(String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                              double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability) {
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
                baseReliability);
    }

    public static Ship reconstruct(UUID id, String name, String description, ShipClass shipClass, BigDecimal price, int maxCargoCapacity, double maxSpeed,
                                   double fuelConsumption, BigDecimal maxFuel, BigDecimal operatingCost, double baseReliability) {
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
                baseReliability);
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
}
