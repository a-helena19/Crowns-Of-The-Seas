package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class SmuggleOfferEvent {
    private String offerId;
    private String playerId;
    private String portId;
    private String travelId;
    private String playerShipId;
    private BigDecimal reward;
    private String cargoDescription;

    public SmuggleOfferEvent(String offerId, String playerId, String portId, String travelId, String playerShipId,
                             BigDecimal reward, String cargoDescription) {
        this.offerId = offerId;
        this.playerId = playerId;
        this.portId = portId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
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

    public String getTravelId() {
        return travelId;
    }

    public String getPlayerShipId() {
        return playerShipId;
    }

    public BigDecimal getReward() {
        return reward;
    }

    public String getCargoDescription() {
        return cargoDescription;
    }
}
