package at.fhv.backend.domain.model.travel;

import at.fhv.backend.domain.model.exception.InvalidTravelDataException;
import at.fhv.backend.domain.model.exception.InvalidTravelStateException;
import at.fhv.backend.domain.model.exception.SamePortException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class Travel {
    private final UUID travelId;
    private final UUID playerShipId;
    private final UUID playerId;
    private final UUID originPortId;
    private final UUID destinationPortId;
    private final double distance;
    private final double speedSetting;
    private final double riskFactor;
    private final BigDecimal baseReward;
    private TravelStatus travelStatus;
    private final Instant startedAt;
    private Instant arrivedAt;
    private double fuelConsumed;


    private Travel(UUID travelId, UUID playerShipId, UUID playerId, UUID originPortId, UUID destinationPortId,
                   double distance, double speedSetting, double riskFactor, BigDecimal baseReward, TravelStatus travelStatus,
                   Instant startedAt, Instant arrivedAt, double fuelConsumed) {
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.playerId = playerId;
        this.originPortId = originPortId;
        this.destinationPortId = destinationPortId;
        this.distance = distance;
        this.speedSetting = speedSetting;
        this.riskFactor = riskFactor;
        this.baseReward = baseReward;
        this.travelStatus = travelStatus;
        this.startedAt = startedAt;
        this.arrivedAt = arrivedAt;
        this.fuelConsumed = fuelConsumed;
    }

    public static Travel start (UUID playerShipId, UUID playerId, UUID originPortId, UUID destinationPortId,
                                double distance, double speedSetting, double riskFactor, BigDecimal baseReward) {
        if (originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same port", originPortId);
        }

        if (distance <= 0) {
            throw new InvalidTravelDataException("Distance must be more than 0", "distance", destinationPortId);
        }

        return new Travel(
                UUID.randomUUID(),
                playerShipId,
                playerId,
                originPortId,
                destinationPortId,
                distance,
                speedSetting,
                riskFactor,
                baseReward,
                TravelStatus.IN_PROGRESS,
                Instant.now(), null, 0.0
        );
    }

    public static Travel reconstruct(UUID travelId, UUID playerShipId, UUID playerId, UUID originPortId, UUID destinationPortId,
                                     double distance, double speedSetting, double riskFactor, BigDecimal baseReward, TravelStatus travelStatus,
                                     Instant startedAt, Instant arrivedAt, double fuelConsumed) {
        return new Travel(travelId,
                playerShipId,
                playerId,
                originPortId,
                destinationPortId,
                distance,
                speedSetting,
                riskFactor,
                baseReward,
                travelStatus,
                startedAt,
                arrivedAt,
                fuelConsumed);
    }

    public void markAsArrived(double fuelConsumed, TravelStatus travelStatus) {
        if (this.travelStatus != TravelStatus.IN_PROGRESS) {
            throw new InvalidTravelStateException("Only travels with status IN_PROGRESS can be marked as ARRIVED", travelStatus);
        }
        this.travelStatus = TravelStatus.ARRIVED;
        this.arrivedAt = Instant.now();
        this.fuelConsumed = fuelConsumed;
    }

    public void cancel() {
        if (this.travelStatus != TravelStatus.IN_PROGRESS && this.travelStatus != TravelStatus.PLANNED) {
            throw new InvalidTravelStateException("Only PLANNED or IN_PROGRESS travels can be cancelled.", travelStatus);
        }
        this.travelStatus = TravelStatus.CANCELLED;
    }

    public UUID getTravelId() {
        return travelId;
    }

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public UUID getOriginPortId() {
        return originPortId;
    }

    public UUID getDestinationPortId() {
        return destinationPortId;
    }

    public double getDistance() {
        return distance;
    }

    public double getSpeedSetting() {
        return speedSetting;
    }

    public double getRiskFactor() {
        return riskFactor;
    }

    public BigDecimal getBaseReward() {
        return baseReward;
    }

    public TravelStatus getTravelStatus() {
        return travelStatus;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getArrivedAt() {
        return arrivedAt;
    }

    public double getFuelConsumed() {
        return fuelConsumed;
    }
}
