package at.fhv.backend.domain.model.ship;

import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;

import java.util.UUID;

//session id, x, y
public class PlayerShip {
    private final UUID id;
    private final UUID shipId;
    private final UUID playerId;
    private final UUID sessionId;
    private ShipStatus status;
    private double condition;
    private double fuel;
    private UUID currentPortId;
    private UUID targetPortId;
    private int loadingCompletedAtTick = -1;

    private PlayerShip(UUID id, UUID shipId, UUID playerId, UUID sessionId, ShipStatus status, double condition, double fuel,
                       UUID currentPortId, UUID targetPortId, int loadingCompletedAtTick) {
        this.id = id;
        this.shipId = shipId;
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.status = status;
        this.condition = condition;
        this.fuel = fuel;
        this.currentPortId = currentPortId;
        this.targetPortId = targetPortId;
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public static PlayerShip createFromPurchase(UUID shipId, UUID playerId, UUID sessionId, UUID startPortId) {
        return new PlayerShip(
                UUID.randomUUID(),
                shipId,
                playerId,
                sessionId,
                ShipStatus.IN_REGISTRATION,
                100.0,
                100.0,
                startPortId,
                null,
                -1
        );
    }

    public static PlayerShip reconstruct(UUID id, UUID shipId, UUID playerId, UUID sessionId, ShipStatus status, double condition, double fuel,
                                         UUID currentPortId, UUID targetPortId, int loadingCompletedAtTick) {
        return new PlayerShip(
                id,
                shipId,
                playerId,
                sessionId,
                status,
                condition,
                fuel,
                currentPortId,
                targetPortId,
                loadingCompletedAtTick);
    }

    public void completeRegistration() {
        if (this.status != ShipStatus.IN_REGISTRATION) {
            throw new InvalidShipStatusTransition("Ship must have the status IN_REGISTRATION", "shipId", shipId);
        }

        this.status = ShipStatus.AT_PORT;
    }

    public void departForVoyage(UUID destinationPortId) {
        if (this.status != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must have the status AT_PORT", "shipId", shipId);
        }
        this.status = ShipStatus.EN_ROUTE;
        this.targetPortId = destinationPortId;
        this.currentPortId = null;
    }

    public void startLoading(UUID destinationPortId, int loadingCompletedAtTick) {
        if (this.status != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status AT_PORT to start loading",
                    "shipId",
                    shipId
            );
        }
        this.status = ShipStatus.LOADING;
        this.targetPortId = destinationPortId;
        // Behalte currentPortId, da sie für den Reisestart benötigt wird
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public boolean isStillLoading(int currentTick) {
        return loadingCompletedAtTick > 0 && currentTick < loadingCompletedAtTick;
    }

    public void completeLoadingAndDepart() {
        if (this.status != ShipStatus.LOADING) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status LOADING to complete loading and depart",
                    "shipId",
                    shipId
            );
        }
        this.status = ShipStatus.EN_ROUTE;
        this.loadingCompletedAtTick = -1;
    }

    public int getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }

    public void arriveAtPort(UUID portId) {
        if (this.status != ShipStatus.EN_ROUTE) {
            throw new InvalidShipStatusTransition("Ship must have the status EN_ROUTE", "shipId", shipId);
        }
        this.status = ShipStatus.AT_PORT;
        this.currentPortId = portId;
        this.targetPortId = null;
    }

    public void consumeFuel(double amountPercent) {
        this.fuel = Math.max(0.0, this.fuel - amountPercent);
    }

    public void applyWear(double amountPercent) {
        this.condition = Math.max(0.0, this.condition - amountPercent);
    }

    public boolean isOwnedBy(UUID playerId) {
        return this.playerId.equals(playerId);
    }

    public UUID getId() {
        return id;
    }

    public UUID getShipId() {
        return shipId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public ShipStatus getStatus() {
        return status;
    }

    public double getCondition() {
        return condition;
    }

    public double getFuel() {
        return fuel;
    }

    public UUID getCurrentPortId() {
        return currentPortId;
    }

    public UUID getTargetPortId() {
        return targetPortId;
    }
}