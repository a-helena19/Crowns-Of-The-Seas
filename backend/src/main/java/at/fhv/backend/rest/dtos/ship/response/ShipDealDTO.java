package at.fhv.backend.rest.dtos.ship.response;

import at.fhv.backend.domain.model.ship.ShipClass;

import java.math.BigDecimal;
import java.util.UUID;

public class ShipDealDTO {
    private UUID dealId;
    private UUID shipId;
    private String name;
    private String description;
    private ShipClass shipClass;
    private String iconUrl;

    private int maxCargoCapacity;
    private double maxSpeed;
    private double fuelConsumption;
    private BigDecimal maxFuel;
    private BigDecimal operatingCost;
    private double baseReliability;

    private BigDecimal originalPrice;
    private BigDecimal dealPrice;
    private int discountPercent;
    private int remainingQuantity;
    private int expiresInTicks;
    private boolean traderBonus;

    public ShipDealDTO() {
    }

    public UUID getDealId() {
        return dealId;
    }

    public void setDealId(UUID dealId) {
        this.dealId = dealId;
    }

    public UUID getShipId() {
        return shipId;
    }

    public void setShipId(UUID shipId) {
        this.shipId = shipId;
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

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
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

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public BigDecimal getDealPrice() {
        return dealPrice;
    }

    public void setDealPrice(BigDecimal dealPrice) {
        this.dealPrice = dealPrice;
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(int discountPercent) {
        this.discountPercent = discountPercent;
    }

    public int getRemainingQuantity() {
        return remainingQuantity;
    }

    public void setRemainingQuantity(int remainingQuantity) {
        this.remainingQuantity = remainingQuantity;
    }

    public int getExpiresInTicks() {
        return expiresInTicks;
    }

    public void setExpiresInTicks(int expiresInTicks) {
        this.expiresInTicks = expiresInTicks;
    }

    public boolean isTraderBonus() {
        return traderBonus;
    }

    public void setTraderBonus(boolean traderBonus) {
        this.traderBonus = traderBonus;
    }
}