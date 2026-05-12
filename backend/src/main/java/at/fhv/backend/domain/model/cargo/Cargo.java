package at.fhv.backend.domain.model.cargo;

import java.math.BigDecimal;
import java.util.UUID;

public class Cargo {
    private final UUID id;
    private final String name;
    private final String description;
    private final BigDecimal baseReward;
    private final int capacity;
    private final CargoType cargoType;
    private final double risk;

    public Cargo(UUID id, String name, String description, BigDecimal baseReward, int capacity, CargoType cargoType, double risk) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.baseReward = baseReward;
        this.capacity = capacity;
        this.cargoType = cargoType;
        this.risk = risk;
    }

    public static Cargo create(String name, String description, BigDecimal baseReward, int capacity,
                               CargoType cargoType, double risk) {
        return new Cargo(UUID.randomUUID(), name, description, baseReward, capacity, cargoType, risk);
    }

    public static Cargo reconstruct(UUID id, String name, String description, BigDecimal baseReward, int capacity, CargoType cargoType, double risk) {
        return new Cargo(id, name, description, baseReward, capacity, cargoType, risk);
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

    public BigDecimal getBaseReward() {
        return baseReward;
    }

    public int getCapacity() {
        return capacity;
    }

    public CargoType getCargoType() {
        return cargoType;
    }

    public double getRisk() {
        return risk;
    }
}
