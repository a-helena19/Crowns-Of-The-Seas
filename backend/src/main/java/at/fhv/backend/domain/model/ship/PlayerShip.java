package at.fhv.backend.domain.model.ship;

import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;

import java.util.UUID;

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
    private int unloadingCompletedAtTick = -1;
    private int refuelingCompletedAtTick = -1;
    private int repairingCompletedAtTick = -1;
    private double pendingFuelAmount = 0.0;
    private double pendingRepairAmount = 0.0;

    private PlayerShip(UUID id, UUID shipId, UUID playerId, UUID sessionId,
                       ShipStatus status, double condition, double fuel,
                       UUID currentPortId, UUID targetPortId,
                       int loadingCompletedAtTick, int unloadingCompletedAtTick,
                       int refuelingCompletedAtTick, int repairingCompletedAtTick,
                       double pendingFuelAmount, double pendingRepairAmount) {
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
        this.unloadingCompletedAtTick = unloadingCompletedAtTick;
        this.refuelingCompletedAtTick = refuelingCompletedAtTick;
        this.repairingCompletedAtTick = repairingCompletedAtTick;
        this.pendingFuelAmount = pendingFuelAmount;
        this.pendingRepairAmount = pendingRepairAmount;
    }

    public static PlayerShip createFromPurchase(UUID shipId, UUID playerId, UUID sessionId, UUID startPortId) {
        return new PlayerShip(
                UUID.randomUUID(),
                shipId, playerId, sessionId,
                ShipStatus.IN_REGISTRATION,
                100.0, 100.0,
                startPortId, null,
                -1, -1, -1, -1,
                0.0, 0.0
        );
    }

    public static PlayerShip createFromUsedListing(UUID shipId, UUID playerId, UUID sessionId, UUID currentPortId,
                                                   double condition, double fuel) {
        return new PlayerShip(
                UUID.randomUUID(),
                shipId, playerId, sessionId,
                ShipStatus.AT_PORT,
                condition, fuel,
                currentPortId, null,
                -1, -1, -1, -1,
                0.0, 0.0
        );
    }

    public static PlayerShip reconstruct(UUID id, UUID shipId, UUID playerId, UUID sessionId, ShipStatus status,
                                         double condition, double fuel,
                                         UUID currentPortId, UUID targetPortId,
                                         Integer loadingCompletedAtTick, Integer unloadingCompletedAtTick,
                                         Integer refuelingCompletedAtTick, Integer repairingCompletedAtTick,
                                         Double pendingFuelAmount, Double pendingRepairAmount) {
        return new PlayerShip(
                id, shipId, playerId, sessionId,
                status, condition, fuel,
                currentPortId, targetPortId,
                loadingCompletedAtTick == null ? -1 : loadingCompletedAtTick,
                unloadingCompletedAtTick == null ? -1 : unloadingCompletedAtTick,
                refuelingCompletedAtTick == null ? -1 : refuelingCompletedAtTick,
                repairingCompletedAtTick == null ? -1 : repairingCompletedAtTick,
                pendingFuelAmount == null ? 0.0 : pendingFuelAmount,
                pendingRepairAmount == null ? 0.0 : pendingRepairAmount);
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
                    "Ship must have the status AT_PORT to start loading", "shipId", shipId);
        }
        this.status = ShipStatus.LOADING;
        this.targetPortId = destinationPortId;
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public boolean isStillLoading(int currentTick) {
        return loadingCompletedAtTick > 0 && currentTick < loadingCompletedAtTick;
    }

    public void completeLoading() {
        if (this.status != ShipStatus.LOADING) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status LOADING to complete loading", "shipId", shipId);
        }
        this.status = ShipStatus.READY_TO_DEPART;
        this.loadingCompletedAtTick = -1;
    }

    public void depart() {
        if (this.status != ShipStatus.READY_TO_DEPART) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status READY_TO_DEPART to depart", "shipId", shipId);
        }
        this.status = ShipStatus.EN_ROUTE;
        this.currentPortId = null;
    }

    public int getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }

    public void arriveAndStartUnloading(UUID portId, int unloadingCompletedAtTick) {
        if (this.status != ShipStatus.EN_ROUTE) {
            throw new InvalidShipStatusTransition("Ship must have the status EN_ROUTE", "shipId", shipId);
        }
        this.status = ShipStatus.UNLOADING;
        this.currentPortId = portId;
        this.targetPortId = null;
        this.unloadingCompletedAtTick = unloadingCompletedAtTick;
    }

    public void arriveAndAwaitCustoms(UUID portId) {
        if (this.status != ShipStatus.EN_ROUTE) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status EN_ROUTE to start a customs block", "shipId", shipId);
        }
        this.status = ShipStatus.BLOCKED;
        this.currentPortId = portId;
        this.targetPortId = null;
    }

    public void completeCustomsBlockAndStartUnloading(int unloadingCompletedAtTick) {
        if (this.status != ShipStatus.BLOCKED) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status BLOCKED to complete customs hold", "shipId", shipId);
        }
        this.status = ShipStatus.UNLOADING;
        this.unloadingCompletedAtTick = unloadingCompletedAtTick;
    }

    public boolean isStillUnloading(int currentTick) {
        return status == ShipStatus.UNLOADING && unloadingCompletedAtTick > 0 && currentTick < unloadingCompletedAtTick;
    }

    public void completeUnloading() {
        if (this.status != ShipStatus.UNLOADING) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status UNLOADING to complete unloading", "shipId", shipId);
        }
        this.status = ShipStatus.AT_PORT;
        this.unloadingCompletedAtTick = -1;
    }

    public void startRefueling(int refuelingCompletedAtTick, double fuelAmount) {
        if (this.status != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status AT_PORT to start refueling", "shipId", shipId);
        }
        this.status = ShipStatus.REFUELING;
        this.refuelingCompletedAtTick = refuelingCompletedAtTick;
        this.pendingFuelAmount = fuelAmount;
    }

    public boolean isStillRefueling(int currentTick) {
        return status == ShipStatus.REFUELING
                && refuelingCompletedAtTick > 0
                && currentTick < refuelingCompletedAtTick;
    }

    public void completeRefueling() {
        if (this.status != ShipStatus.REFUELING) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status REFUELING to complete refueling", "shipId", shipId);
        }
        addFuel(pendingFuelAmount);
        this.status = ShipStatus.AT_PORT;
        this.refuelingCompletedAtTick = -1;
        this.pendingFuelAmount = 0.0;
    }

    public int getRefuelingCompletedAtTick() {
        return refuelingCompletedAtTick;
    }

    public double getPendingFuelAmount() {
        return pendingFuelAmount;
    }

    public void startRepairing(int repairingCompletedAtTick, double repairAmount) {
        if (this.status != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status AT_PORT to start repairing", "shipId", shipId);
        }
        this.status = ShipStatus.REPAIRING;
        this.repairingCompletedAtTick = repairingCompletedAtTick;
        this.pendingRepairAmount = repairAmount;
    }

    public boolean isStillRepairing(int currentTick) {
        return status == ShipStatus.REPAIRING
                && repairingCompletedAtTick > 0
                && currentTick < repairingCompletedAtTick;
    }

    public void completeRepairing() {
        if (this.status != ShipStatus.REPAIRING) {
            throw new InvalidShipStatusTransition(
                    "Ship must have the status REPAIRING to complete repairing", "shipId", shipId);
        }
        applyRepair(pendingRepairAmount);
        this.status = ShipStatus.AT_PORT;
        this.repairingCompletedAtTick = -1;
        this.pendingRepairAmount = 0.0;
    }

    public int getRepairingCompletedAtTick() {
        return repairingCompletedAtTick;
    }

    public double getPendingRepairAmount() {
        return pendingRepairAmount;
    }

    public Integer getUnloadingCompletedAtTick() {
        return unloadingCompletedAtTick;
    }

    public void consumeFuel(double amountPercent) {
        this.fuel = Math.max(0.0, this.fuel - amountPercent);
    }

    public void addFuel(double amountPercent) {
        this.fuel = Math.min(100.0, this.fuel + amountPercent);
    }

    public void applyWear(double amountPercent) {
        this.condition = Math.max(0.0, this.condition - amountPercent);
    }

    public void applyRepair(double amountPercent) {
        this.condition = Math.min(100.0, this.condition + amountPercent);
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