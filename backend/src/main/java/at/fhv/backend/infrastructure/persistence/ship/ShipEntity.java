package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.ShipClass;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ships")
public class ShipEntity {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "ship_class", nullable = false)
    private ShipClass shipClass;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "max_cargo_capacity", nullable = false)
    private int maxCargoCapacity;

    @Column(name = "max_speed", nullable = false)
    private double maxSpeed;

    @Column(name = "fuel_consumption", nullable = false)
    private double fuelConsumption;

    @Column(name = "max_fuel", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxFuel;

    @Column(name = "operating_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal operatingCost;

    @Column(name = "base_reliability", nullable = false)
    private double baseReliability;

    public ShipEntity() {}

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
}
