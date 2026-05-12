package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;
import java.util.UUID;

public class SellShipQuoteDTO {
    private UUID playerShipId;
    private String shipName;
    private BigDecimal originalPrice;
    private BigDecimal baseSellPrice;
    private double condition;
    private double fuel;
    private double conditionWeight;
    private double fuelWeight;
    private BigDecimal finalPrice;

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public String getShipName() {
        return shipName;
    }

    public void setShipName(String shipName) {
        this.shipName = shipName;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public BigDecimal getBaseSellPrice() {
        return baseSellPrice;
    }

    public void setBaseSellPrice(BigDecimal baseSellPrice) {
        this.baseSellPrice = baseSellPrice;
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

    public double getConditionWeight() {
        return conditionWeight;
    }

    public void setConditionWeight(double conditionWeight) {
        this.conditionWeight = conditionWeight;
    }

    public double getFuelWeight() {
        return fuelWeight;
    }

    public void setFuelWeight(double fuelWeight) {
        this.fuelWeight = fuelWeight;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
    }
}
