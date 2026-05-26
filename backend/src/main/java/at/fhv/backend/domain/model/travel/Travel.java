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
    private final UUID sessionId;
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
    private int startTick;
    private int arrivalTick;
    private double loadingDurationSeconds;
    /** Ankunfts-Strafe (Anlege-Minispiel fehlgeschlagen) */
    private BigDecimal dockingFine = BigDecimal.ZERO;
    /** Abfahrts-Strafe (Ablege-Minispiel fehlgeschlagen) */
    private BigDecimal departureDockingFine = BigDecimal.ZERO;
    private boolean pilotageServiceBooked = false;
    private boolean pilotageStrikeRevoked = false;
    private BigDecimal pilotageRefund = BigDecimal.ZERO;
    private boolean arrivalMiniGamePending = false;

    private Travel(UUID travelId, UUID playerShipId, UUID playerId, UUID sessionId,
                   UUID originPortId, UUID destinationPortId,
                   double distance, double speedSetting, double riskFactor, BigDecimal baseReward,
                   TravelStatus travelStatus, Instant startedAt, Instant arrivedAt,
                   double fuelConsumed, int startTick, int arrivalTick,
                   BigDecimal departureDockingFine, BigDecimal dockingFine,
                   boolean pilotageServiceBooked, boolean pilotageStrikeRevoked, BigDecimal pilotageRefund,
                   boolean arrivalMiniGamePending) {
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.playerId = playerId;
        this.sessionId = sessionId;
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
        this.startTick = startTick;
        this.arrivalTick = arrivalTick;
        this.departureDockingFine = departureDockingFine != null ? departureDockingFine : BigDecimal.ZERO;
        this.dockingFine = dockingFine != null ? dockingFine : BigDecimal.ZERO;
        this.pilotageServiceBooked = pilotageServiceBooked;
        this.pilotageStrikeRevoked = pilotageStrikeRevoked;
        this.pilotageRefund = pilotageRefund != null ? pilotageRefund : BigDecimal.ZERO;
        this.arrivalMiniGamePending = arrivalMiniGamePending;
    }

    public static Travel start(UUID playerShipId, UUID playerId, UUID sessionId,
                               UUID originPortId, UUID destinationPortId,
                               double distance, double speedSetting,
                               double riskFactor, BigDecimal baseReward,
                               int currentTick) {
        return start(playerShipId, playerId, sessionId, originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward, currentTick, 0);
    }

    public static Travel start(UUID playerShipId, UUID playerId, UUID sessionId,
                               UUID originPortId, UUID destinationPortId,
                               double distance, double speedSetting,
                               double riskFactor, BigDecimal baseReward,
                               int currentTick, int startTickDelay) {
        validate(originPortId, destinationPortId, distance);

        int durationTicks = (int) Math.ceil(distance / Math.max(speedSetting, 0.01));
        int effectiveStartTick = currentTick + Math.max(0, startTickDelay);
        int arrivalTick = effectiveStartTick + durationTicks;

        return new Travel(
                UUID.randomUUID(),
                playerShipId, playerId, sessionId,
                originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward,
                TravelStatus.IN_PROGRESS,
                Instant.now(), null, 0.0,
                effectiveStartTick, arrivalTick, BigDecimal.ZERO, BigDecimal.ZERO,
                false, false, BigDecimal.ZERO, false
        );
    }

    public static Travel plan(UUID playerShipId, UUID playerId, UUID sessionId,
                              UUID originPortId, UUID destinationPortId,
                              double distance, double speedSetting,
                              double riskFactor, BigDecimal baseReward,
                              int currentTick, int startTickDelay) {
        validate(originPortId, destinationPortId, distance);

        int durationTicks = (int) Math.ceil(distance / Math.max(speedSetting, 0.01));
        int effectiveStartTick = currentTick + Math.max(0, startTickDelay);
        int arrivalTick = effectiveStartTick + durationTicks;

        return new Travel(
                UUID.randomUUID(),
                playerShipId, playerId, sessionId,
                originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward,
                TravelStatus.PLANNED,
                Instant.now(), null, 0.0,
                effectiveStartTick, arrivalTick
        );
    }

    public void activate(int currentTick, int startTickDelay) {
        if (this.travelStatus != TravelStatus.PLANNED) {
            throw new InvalidTravelStateException(
                    "Only PLANNED travels can be activated",
                    this.travelStatus
            );
        }
        int durationTicks = (int) Math.ceil(this.distance / Math.max(this.speedSetting, 0.01));
        int effectiveStartTick = currentTick + Math.max(0, startTickDelay);

        this.startTick = effectiveStartTick;
        this.arrivalTick = effectiveStartTick + durationTicks;
        this.travelStatus = TravelStatus.IN_PROGRESS;
    }

    private static void validate(UUID originPortId, UUID destinationPortId, double distance) {
        if (originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same port", originPortId);
        }
        if (distance <= 0) {
            throw new InvalidTravelDataException("Distance must be more than 0", "distance", destinationPortId);
        }
    }

    public static Travel reconstruct(UUID travelId, UUID playerShipId, UUID playerId, UUID sessionId,
                                     UUID originPortId, UUID destinationPortId,
                                     double distance, double speedSetting, double riskFactor,
                                     BigDecimal baseReward, TravelStatus travelStatus,
                                     Instant startedAt, Instant arrivedAt, double fuelConsumed,
                                     int startTick, int arrivalTick,
                                     BigDecimal departureDockingFine, BigDecimal dockingFine,
                                     boolean pilotageServiceBooked, boolean pilotageStrikeRevoked,
                                     BigDecimal pilotageRefund, boolean arrivalMiniGamePending) {
        return new Travel(travelId, playerShipId, playerId, sessionId,
                originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward,
                travelStatus, startedAt, arrivedAt, fuelConsumed,
                startTick, arrivalTick, departureDockingFine, dockingFine,
                pilotageServiceBooked, pilotageStrikeRevoked, pilotageRefund, arrivalMiniGamePending);
    }

    public static Travel reconstruct(UUID travelId, UUID playerShipId, UUID playerId, UUID sessionId,
                                     UUID originPortId, UUID destinationPortId,
                                     double distance, double speedSetting, double riskFactor,
                                     BigDecimal baseReward, TravelStatus travelStatus,
                                     Instant startedAt, Instant arrivedAt, double fuelConsumed,
                                     int startTick, int arrivalTick,
                                     BigDecimal departureDockingFine, BigDecimal dockingFine,
                                     boolean pilotageServiceBooked, boolean pilotageStrikeRevoked,
                                     BigDecimal pilotageRefund) {
        return reconstruct(travelId, playerShipId, playerId, sessionId,
                originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward,
                travelStatus, startedAt, arrivedAt, fuelConsumed,
                startTick, arrivalTick, departureDockingFine, dockingFine,
                pilotageServiceBooked, pilotageStrikeRevoked, pilotageRefund, false);
    }

    public static Travel reconstruct(UUID travelId, UUID playerShipId, UUID playerId, UUID sessionId,
                                     UUID originPortId, UUID destinationPortId,
                                     double distance, double speedSetting, double riskFactor,
                                     BigDecimal baseReward, TravelStatus travelStatus,
                                     Instant startedAt, Instant arrivedAt, double fuelConsumed,
                                     int startTick, int arrivalTick,
                                     BigDecimal departureDockingFine, BigDecimal dockingFine) {
        return reconstruct(travelId, playerShipId, playerId, sessionId,
                originPortId, destinationPortId,
                distance, speedSetting, riskFactor, baseReward,
                travelStatus, startedAt, arrivedAt, fuelConsumed,
                startTick, arrivalTick, departureDockingFine, dockingFine,
                false, false, BigDecimal.ZERO, false);
    }

    public void markDockingFailure(BigDecimal fine) {
        this.dockingFine = fine != null ? fine : BigDecimal.ZERO;
    }

    public void markDepartureDockingFailure(BigDecimal fine) {
        this.departureDockingFine = fine != null ? fine : BigDecimal.ZERO;
    }

    public void setPilotageServiceBooked(boolean pilotageServiceBooked) {
        this.pilotageServiceBooked = pilotageServiceBooked;
    }

    public void revokePilotageDueToStrike(BigDecimal refund) {
        this.pilotageStrikeRevoked = true;
        this.pilotageRefund = refund != null ? refund : BigDecimal.ZERO;
    }

    public void markAsArrived(double fuelConsumed) {
        if (this.travelStatus != TravelStatus.IN_PROGRESS) {
            throw new InvalidTravelStateException(
                    "Only travels with status IN_PROGRESS can be marked as ARRIVED",
                    this.travelStatus
            );
        }

        this.travelStatus = TravelStatus.ARRIVED;
        this.arrivedAt = Instant.now();
        this.fuelConsumed = fuelConsumed;
    }

    public void markAsCompleted() {
        if (this.travelStatus != TravelStatus.ARRIVED) {
            throw new InvalidTravelStateException("Only travels with status ARRIVED can be marked as COMPLETED", travelStatus);
        }
        this.travelStatus = TravelStatus.COMPLETED;
    }

    public void cancel() {
        if (this.travelStatus != TravelStatus.IN_PROGRESS && this.travelStatus != TravelStatus.PLANNED) {
            throw new InvalidTravelStateException("Only PLANNED or IN_PROGRESS travels can be cancelled.", travelStatus);
        }
        this.travelStatus = TravelStatus.CANCELLED;
    }



    public double getProgress(int currentTick) {
        if (arrivalTick <= startTick) return 1.0;
        double raw = (double) (currentTick - startTick) / (arrivalTick - startTick);
        return Math.max(0.0, Math.min(1.0, raw));
    }

    public double getLoadingDurationSeconds() { return loadingDurationSeconds; }
    public void setLoadingDurationSeconds(double loadingDurationSeconds) { this.loadingDurationSeconds = loadingDurationSeconds; }

    public void shiftArrivalTick(int additionalTicks) {
        this.arrivalTick = this.arrivalTick + additionalTicks;
    }

    public int getOriginalDurationTicks() {
        return (int) Math.ceil(this.distance / Math.max(this.speedSetting, 0.01));
    }

    public int getOriginalArrivalTick() {
        return this.startTick + getOriginalDurationTicks();
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

    public UUID getSessionId() {
        return sessionId;
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

    public int getStartTick() {
        return startTick;
    }

    public int getArrivalTick() {
        return arrivalTick;
    }

    public double getProgress(int currentTick) {
        if (arrivalTick <= startTick) return 1.0;
        double raw = (double) (currentTick - startTick) / (arrivalTick - startTick);
        return Math.max(0.0, Math.min(1.0, raw));
    }

    public double getLoadingDurationSeconds() {
        return loadingDurationSeconds;
    }

    public void setLoadingDurationSeconds(double loadingDurationSeconds) {
        this.loadingDurationSeconds = loadingDurationSeconds;
    }

    public void shiftArrivalTick(int additionalTicks) {
        this.arrivalTick = this.arrivalTick + additionalTicks;
    }

    public BigDecimal getDockingFine() {
        return dockingFine != null ? dockingFine : BigDecimal.ZERO;
    }

    public BigDecimal getDepartureDockingFine() {
        return departureDockingFine != null ? departureDockingFine : BigDecimal.ZERO;
    }

    public boolean isPilotageServiceBooked() {
        return pilotageServiceBooked;
    }

    public boolean isPilotageStrikeRevoked() {
        return pilotageStrikeRevoked;
    }

    public BigDecimal getPilotageRefund() {
        return pilotageRefund != null ? pilotageRefund : BigDecimal.ZERO;
    }

    public boolean isArrivalMiniGamePending() {
        return arrivalMiniGamePending;
    }

    public void setArrivalMiniGamePending(boolean arrivalMiniGamePending) {
        this.arrivalMiniGamePending = arrivalMiniGamePending;
    }
}