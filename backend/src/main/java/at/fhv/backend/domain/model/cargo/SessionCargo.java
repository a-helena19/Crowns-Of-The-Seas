package at.fhv.backend.domain.model.cargo;

import at.fhv.backend.domain.model.cargo.exception.CargoNotAssignedException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;

import java.math.BigDecimal;
import java.util.UUID;

public class SessionCargo {
    private final UUID id;
    private final UUID  cargoId;
    private final UUID sessionId;
    private final UUID originPortId;
    private final UUID destinationPortId;
    private final BigDecimal reward;
    private final boolean containsIllegal;
    private final int capacity;
    private final CargoType cargoType;
    private final double risk;
    private CargoStatus cargoStatus;
    private UUID assignedPlayerId;
    private UUID assignedPlayerShipId;
    private final int spawnTick;
    private int cooldownUntilTick;

    public SessionCargo(UUID id, UUID cargoId, UUID sessionId, UUID originPortId, UUID destinationPortId, BigDecimal reward, boolean containsIllegal,
                        int capacity, CargoType cargoType, double risk, CargoStatus cargoStatus, UUID assignedPlayerId, UUID assignedPlayerShipId, int spawnTick, int cooldownUntilTick) {
        this.id = id;
        this.cargoId = cargoId;
        this.sessionId = sessionId;
        this.originPortId = originPortId;
        this.destinationPortId = destinationPortId;
        this.reward = reward;
        this.containsIllegal = containsIllegal;
        this.capacity = capacity;
        this.cargoType = cargoType;
        this.risk = risk;
        this.cargoStatus = cargoStatus;
        this.assignedPlayerId = assignedPlayerId;
        this.assignedPlayerShipId = assignedPlayerShipId;
        this.spawnTick = spawnTick;
        this.cooldownUntilTick = cooldownUntilTick;
    }

    public static SessionCargo create(UUID cargoId, UUID sessionId, UUID originPortId, UUID destinationPortId, BigDecimal reward,
                                      boolean containsIllegal, int capacity, CargoType cargoType, double risk, int spawnTick) {
        return new SessionCargo(
                UUID.randomUUID(),
                cargoId,
                sessionId,
                originPortId,
                destinationPortId,
                reward,
                containsIllegal,
                capacity,
                cargoType,
                risk,
                CargoStatus.INACTIVE,
                null,
                null,
                spawnTick,
                -1
        );
    }

    public static SessionCargo reconstruct(UUID id, UUID cargoId, UUID sessionId, UUID originPortId, UUID destinationPortId, BigDecimal reward, boolean containsIllegal,
                                           int capacity, CargoType cargoType, double risk, CargoStatus cargoStatus, UUID assignedPlayerId, UUID assignedPlayerShipId, int spawnTick, int cooldownUntilTick) {
        return new SessionCargo(
                id,
                cargoId,
                sessionId,
                originPortId,
                destinationPortId,
                reward,
                containsIllegal,
                capacity,
                cargoType,
                risk,
                cargoStatus,
                assignedPlayerId,
                assignedPlayerShipId,
                spawnTick,
                cooldownUntilTick);
    }

    public void activate() {
        if (cargoStatus == CargoStatus.INACTIVE) {
            this.cargoStatus = CargoStatus.AVAILABLE;
            this.cooldownUntilTick = -1;
        }
    }

    public void assign(UUID playerId, UUID playerShipId, int cooldownTicks, int currentTick) {
        if (cargoStatus != CargoStatus.AVAILABLE) {
            throw new CargoNotAvailableException(id);
        }
        this.cargoStatus = CargoStatus.ASSIGNED;
        this.assignedPlayerId = playerId;
        this.assignedPlayerShipId = playerShipId;
        this.cooldownUntilTick = currentTick + cooldownTicks;
    }

    public void deliver() {
        if (cargoStatus != CargoStatus.ASSIGNED) {
            throw new CargoNotAssignedException(id, cargoStatus.name());
        }
        this.cargoStatus = CargoStatus.DELIVERED;
    }

    public void startCooldown(int cooldownUntilTick) {
        this.cargoStatus = CargoStatus.INACTIVE;
        this.assignedPlayerId = null;
        this.assignedPlayerShipId = null;
        this.cooldownUntilTick = cooldownUntilTick;
    }

    public boolean isVisibleAt(int currentTick) {
        return cargoStatus == CargoStatus.AVAILABLE && currentTick >= spawnTick;
    }

    public boolean shouldRespawnAt(int currentTick) {
        return cargoStatus == CargoStatus.INACTIVE && cooldownUntilTick >= 0 && currentTick >= cooldownUntilTick;
    }

    public UUID getId() {
        return id;
    }

    public UUID getCargoId() {
        return cargoId;
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

    public BigDecimal getReward() {
        return reward;
    }

    public boolean isContainsIllegal() {
        return containsIllegal;
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

    public CargoStatus getCargoStatus() {
        return cargoStatus;
    }

    public UUID getAssignedPlayerId() {
        return assignedPlayerId;
    }

    public UUID getAssignedPlayerShipId() {
        return assignedPlayerShipId;
    }

    public int getSpawnTick() {
        return spawnTick;
    }

    public int getCooldownUntilTick() {
        return cooldownUntilTick;
    }
}
