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
    private boolean containsIllegal;
    private final int capacity;
    private final CargoType cargoType;
    private final double risk;
    private CargoStatus cargoStatus;
    private UUID assignedPlayerId;
    private UUID assignedPlayerShipId;
    private final int spawnTick;
    private int expiresAtTick;
    private final boolean permanent;
    private int loadingCompletedAtTick = -1;

    public SessionCargo(UUID id, UUID cargoId, UUID sessionId, UUID originPortId, UUID destinationPortId, BigDecimal reward, boolean containsIllegal,
                        int capacity, CargoType cargoType, double risk, CargoStatus cargoStatus, UUID assignedPlayerId, UUID assignedPlayerShipId,
                        int spawnTick, int permanent, int expiresAtTick, int loadingCompletedAtTick) {
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
        this.permanent = permanent == 1;
        this.expiresAtTick = expiresAtTick;
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public static SessionCargo create(
            UUID cargoId,
            UUID sessionId,
            UUID originPortId,
            UUID destinationPortId,
            BigDecimal reward,
            boolean containsIllegal,
            int capacity,
            CargoType cargoType,
            double risk,
            int spawnTick,
            int lifetimeTicks,
            boolean permanent
    ) {
        // Luxusfracht läuft nie zeitlich ab — sie bleibt im Hafen, bis sie jemand annimmt.
        int expiresAtTick = (permanent || cargoType == CargoType.LUXURY_GOODS) ? -1 : spawnTick + lifetimeTicks;
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
                CargoStatus.AVAILABLE,
                null,
                null,
                spawnTick,
                permanent ? 1 : 0,
                expiresAtTick,
                -1
        );
    }

    public static SessionCargo reconstruct(UUID id, UUID cargoId, UUID sessionId, UUID originPortId, UUID destinationPortId, BigDecimal reward, boolean containsIllegal,
                                           int capacity, CargoType cargoType, double risk, CargoStatus cargoStatus, UUID assignedPlayerId, UUID assignedPlayerShipId,
                                           int spawnTick, int permanent, int expiresAtTick, int loadingCompletedAtTick) {
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
                permanent,
                expiresAtTick,
                loadingCompletedAtTick);
    }

    public void assignWithLoading(UUID playerId, UUID playerShipId, int expiresAtTick, int loadingCompletedAtTick) {
        if (cargoStatus != CargoStatus.AVAILABLE) {
            throw new CargoNotAvailableException(id);
        }
        this.cargoStatus = CargoStatus.ASSIGNED;
        this.assignedPlayerId = playerId;
        this.assignedPlayerShipId = playerShipId;
        this.expiresAtTick = expiresAtTick;
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }

    public void assign(UUID playerId, UUID playerShipId, int expiresAtTick) {
        if (cargoStatus != CargoStatus.AVAILABLE) {
            throw new CargoNotAvailableException(id);
        }
        this.cargoStatus = CargoStatus.ASSIGNED;
        this.assignedPlayerId = playerId;
        this.assignedPlayerShipId = playerShipId;
        this.expiresAtTick = expiresAtTick;
    }

    public boolean isStillLoading(int currentTick) {
        return loadingCompletedAtTick > 0 && currentTick < loadingCompletedAtTick;
    }

    public boolean isLoadingCompleted(int currentTick) {
        return loadingCompletedAtTick > 0 && currentTick >= loadingCompletedAtTick;
    }

    public void expire() {
        this.cargoStatus = CargoStatus.EXPIRED;
        this.assignedPlayerId = null;
        this.assignedPlayerShipId = null;
    }

    public void block() {
        this.cargoStatus = CargoStatus.BLOCKED;
    }

    public void unblock() {
        this.cargoStatus = CargoStatus.ASSIGNED;
    }

    public void deliver() {
        if (cargoStatus != CargoStatus.ASSIGNED) {
            throw new CargoNotAssignedException(id, cargoStatus.name());
        }
        this.cargoStatus = CargoStatus.DELIVERED;
    }

    public boolean isVisibleAt(int currentTick) {
        return cargoStatus == CargoStatus.AVAILABLE && currentTick >= spawnTick;
    }

    public boolean isExpiredAt(int currentTick) {
        if (permanent) return false;
        return cargoStatus == CargoStatus.AVAILABLE
                && expiresAtTick >= 0 && currentTick > expiresAtTick;
    }

    public void markAsIllegal() {
        this.containsIllegal = true;
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

    public boolean isPermanent() {
        return permanent;
    }

    public int getPermanentAsInt() {
        return permanent ? 1 : 0;
    }

    public int getExpiresAtTick() {
        return expiresAtTick;
    }

    public Integer getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }
}