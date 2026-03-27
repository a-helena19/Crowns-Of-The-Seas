package at.fhv.backend.domain.model.ship;

import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.ShipNotAvailableException;

import java.math.BigDecimal;
import java.util.UUID;

public class Ship {
    private final UUID id;
    private String name;
    private ShipClass shipClass;
    private int maxCargoCapacity;
    private int maxSpeed;
    private BigDecimal operatingCost;
    private int reliability; // der technische Zustand
    private BigDecimal price;
    private ShipStatus status;
    private UUID ownerId;

    private Ship(UUID id, String name, ShipClass shipClass, int maxCargoCapacity, int maxSpeed, BigDecimal operatingCost,
                 int reliability, BigDecimal price, ShipStatus status) {
        this.id = id;
        this.name = name;
        this.shipClass = shipClass;
        this.maxCargoCapacity = maxCargoCapacity;
        this.maxSpeed = maxSpeed;
        this.operatingCost = operatingCost;
        this.reliability = reliability;
        this.price = price;
        this.status = status;
    }

    public static Ship createForMarket(String name, ShipClass shipClass, int maxCargoCapacity, int maxSpeed, BigDecimal operatingCost, int reliability, BigDecimal price) {
        return new Ship(
                UUID.randomUUID(),
                name,
                shipClass,
                maxCargoCapacity,
                maxSpeed,
                operatingCost,
                reliability,
                price,
                ShipStatus.AT_MARKET
        );
    }

    public void purchase(UUID playerId) {
        if (this.status != ShipStatus.AT_MARKET) {
            throw new ShipNotAvailableException("Ship is no longer available on the market.", "shipId", id);
        }
        this.ownerId = playerId;
        this.status = ShipStatus.IN_REGISTRATION;
    }

    public void completeRegistration() {
        if (this.status != ShipStatus.IN_REGISTRATION) {
            throw new InvalidShipStatusTransition("Ship must be in status IN_REGISTRATION.", "shipId", id);
        }
        this.status = ShipStatus.AT_PORT;
    }

    public void startVoyage() {
        if (this.status != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be in a port to start a journey.", "shipId", id);
        }
        this.status = ShipStatus.EN_ROUTE;
    }

    public void arriveAtPort() {
        if (this.status != ShipStatus.EN_ROUTE) {
            throw new InvalidShipStatusTransition("Ship must be traveling (EN_ROUTE) to arrive", "shipId", id);
        }
        this.status = ShipStatus.AT_PORT;
    }

    public void applyWear(int wearAmount) {
        this.reliability = Math.max(0, this.reliability - wearAmount);
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ShipClass getShipClass() {
        return shipClass;
    }

    public int getMaxCargoCapacity() {
        return maxCargoCapacity;
    }

    public int getMaxSpeed() {
        return maxSpeed;
    }

    public BigDecimal getOperatingCost() {
        return operatingCost;
    }

    public int getReliability() {
        return reliability;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public ShipStatus getStatus() {
        return status;
    }

    public UUID getOwnerId() {
        return ownerId;
    }
}
