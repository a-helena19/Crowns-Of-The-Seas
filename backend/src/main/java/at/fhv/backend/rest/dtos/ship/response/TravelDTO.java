package at.fhv.backend.rest.dtos.ship.response;

import at.fhv.backend.domain.model.travel.TravelStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class TravelDTO {
    private UUID travelId;
    private UUID playerShipId;
    private UUID playerId;
    private UUID originPortId;
    private UUID destinationPortId;
    private double distance;
    private double speedSetting;
    private double riskFactor;
    private BigDecimal baseReward;
    private TravelStatus travelStatus;
    private Instant startedAt;
    private Instant arrivedAt;
    private double fuelConsumed;
    private double loadingDurationSeconds;

    public TravelDTO() {}

    public UUID getTravelId() {
        return travelId;
    }

    public void setTravelId(UUID travelId) {
        this.travelId = travelId;
    }

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public void setPlayerId(UUID playerId) {
        this.playerId = playerId;
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

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public double getSpeedSetting() {
        return speedSetting;
    }

    public void setSpeedSetting(double speedSetting) {
        this.speedSetting = speedSetting;
    }

    public double getRiskFactor() {
        return riskFactor;
    }

    public void setRiskFactor(double riskFactor) {
        this.riskFactor = riskFactor;
    }

    public BigDecimal getBaseReward() {
        return baseReward;
    }

    public void setBaseReward(BigDecimal baseReward) {
        this.baseReward = baseReward;
    }

    public TravelStatus getTravelStatus() {
        return travelStatus;
    }

    public void setTravelStatus(TravelStatus travelStatus) {
        this.travelStatus = travelStatus;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getArrivedAt() {
        return arrivedAt;
    }

    public void setArrivedAt(Instant arrivedAt) {
        this.arrivedAt = arrivedAt;
    }

    public double getFuelConsumed() {
        return fuelConsumed;
    }

    public void setFuelConsumed(double fuelConsumed) {
        this.fuelConsumed = fuelConsumed;
    }

    public double getLoadingDurationSeconds() {
        return loadingDurationSeconds;
    }

    public void setLoadingDurationSeconds(double loadingDurationSeconds) {
        this.loadingDurationSeconds = loadingDurationSeconds;
    }
}
