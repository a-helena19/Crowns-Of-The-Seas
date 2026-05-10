package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class SmuggleOfferEvent {
    private String offerId;
    private String playerId;
    private String portId;
    private BigDecimal reward;
    private String cargoDescription;

    public SmuggleOfferEvent(String offerId, String playerId, String portId, BigDecimal reward, String cargoDescription) {
        this.offerId = offerId;
        this.playerId = playerId;
        this.portId = portId;
        this.reward = reward;
        this.cargoDescription = cargoDescription;
    }

    public String getOfferId() {
        return offerId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getPortId() {
        return portId;
    }

    public BigDecimal getReward() {
        return reward;
    }

    public String getCargoDescription() {
        return cargoDescription;
    }
}
