package at.fhv.backend.infrastructure.persistence.travel;

import at.fhv.backend.domain.model.travel.TravelStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "travels")
public class TravelEntity {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID travelId;

    @Column(name = "player_ship_id", nullable = false)
    private UUID playerShipId;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "session_id", nullable = false, columnDefinition = "uuid default '00000000-0000-0000-0000-000000000000'")
    private UUID sessionId;

    @Column(name = "origin_port_id", nullable = false)
    private UUID originPortId;

    @Column(name = "destination_port_id", nullable = false)
    private UUID destinationPortId;

    @Column(nullable = false)
    private double distance;

    @Column(name = "speed_setting", nullable = false)
    private double speedSetting;

    @Column(name = "risk_factor", nullable = false)
    private double riskFactor;

    @Column(name = "base_reward", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseReward;

    @Enumerated(EnumType.STRING)
    @Column(name = "travel_status", nullable = false)
    private TravelStatus travelStatus;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "arrived_at")
    private Instant arrivedAt;

    @Column(name = "fuel_consumed", nullable = false)
    private double fuelConsumed;

    @Column(name = "start_tick", nullable = false, columnDefinition = "int default 0")
    private int startTick;

    @Column(name = "arrival_tick", nullable = false, columnDefinition = "int default 0")
    private int arrivalTick;

    @Column(name = "docking_fine", nullable = false, precision = 12, scale = 2, columnDefinition = "decimal(12,2) default 0")
    private BigDecimal dockingFine = BigDecimal.ZERO;

    @Column(name = "departure_docking_fine", nullable = false, precision = 12, scale = 2, columnDefinition = "decimal(12,2) default 0")
    private BigDecimal departureDockingFine = BigDecimal.ZERO;

    @Column(name = "pilotage_service_booked", nullable = false, columnDefinition = "boolean default false")
    private boolean pilotageServiceBooked = false;

    @Column(name = "pilotage_strike_revoked", nullable = false, columnDefinition = "boolean default false")
    private boolean pilotageStrikeRevoked = false;

    @Column(name = "pilotage_refund", nullable = false, precision = 12, scale = 2, columnDefinition = "decimal(12,2) default 0")
    private BigDecimal pilotageRefund = BigDecimal.ZERO;

    @Column(name = "arrival_mini_game_pending", nullable = false, columnDefinition = "boolean default false")
    private boolean arrivalMiniGamePending = false;

    @Column(name = "empty_voyage", nullable = false, columnDefinition = "boolean default false")
    private boolean emptyVoyage = false;

    @Column(name = "remaining_cargo_factor", nullable = false, columnDefinition = "double precision default 1.0")
    private double remainingCargoFactor = 1.0;

    public TravelEntity() {}

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

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
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

    public int getStartTick() {
        return startTick;
    }

    public void setStartTick(int startTick) {
        this.startTick = startTick;
    }

    public int getArrivalTick() {
        return arrivalTick;
    }

    public void setArrivalTick(int arrivalTick) {
        this.arrivalTick = arrivalTick;
    }

    public BigDecimal getDockingFine() {
        return dockingFine;
    }

    public void setDockingFine(BigDecimal dockingFine) {
        this.dockingFine = dockingFine;
    }

    public BigDecimal getDepartureDockingFine() {
        return departureDockingFine;
    }

    public void setDepartureDockingFine(BigDecimal departureDockingFine) {
        this.departureDockingFine = departureDockingFine;
    }

    public boolean isPilotageServiceBooked() {
        return pilotageServiceBooked;
    }

    public void setPilotageServiceBooked(boolean pilotageServiceBooked) {
        this.pilotageServiceBooked = pilotageServiceBooked;
    }

    public boolean isPilotageStrikeRevoked() {
        return pilotageStrikeRevoked;
    }

    public void setPilotageStrikeRevoked(boolean pilotageStrikeRevoked) {
        this.pilotageStrikeRevoked = pilotageStrikeRevoked;
    }

    public BigDecimal getPilotageRefund() {
        return pilotageRefund;
    }

    public void setPilotageRefund(BigDecimal pilotageRefund) {
        this.pilotageRefund = pilotageRefund;
    }

    public boolean isArrivalMiniGamePending() {
        return arrivalMiniGamePending;
    }

    public void setArrivalMiniGamePending(boolean arrivalMiniGamePending) {
        this.arrivalMiniGamePending = arrivalMiniGamePending;
    }

    public boolean isEmptyVoyage() {
        return emptyVoyage;
    }

    public void setEmptyVoyage(boolean emptyVoyage) {
        this.emptyVoyage = emptyVoyage;
    }

    public double getRemainingCargoFactor() {
        return remainingCargoFactor;
    }

    public void setRemainingCargoFactor(double remainingCargoFactor) {
        this.remainingCargoFactor = remainingCargoFactor;
    }
}
