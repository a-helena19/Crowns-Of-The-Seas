package at.fhv.backend.domain.model.smuggle;

import java.math.BigDecimal;
import java.util.UUID;

public class SmuggleOffer {
    private final UUID id;
    private final UUID playerId;
    private final UUID sessionId;
    private final UUID portId;
    private final BigDecimal reward;
    private final SmuggleType cargoType;
    private SmuggleOfferStatus status;

    public SmuggleOffer(UUID playerId, UUID sessionId, UUID portId, BigDecimal reward, SmuggleType cargoType) {
        this.id = UUID.randomUUID();
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.portId = portId;
        this.reward = reward;
        this.cargoType = cargoType;
        this.status = SmuggleOfferStatus.PENDING;
    }

    public void accept() {
        this.status = SmuggleOfferStatus.ACCEPTED;
    }

    public void decline() {
        this.status = SmuggleOfferStatus.DECLINED;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getPortId() {
        return portId;
    }

    public BigDecimal getReward() {
        return reward;
    }

    public SmuggleType getCargoType() {
        return cargoType;
    }

    public String getCargoDescription() {
        return cargoType.getDisplayName();
    }

    public SmuggleOfferStatus getStatus() {
        return status;
    }
}
