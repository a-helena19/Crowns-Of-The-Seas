package at.fhv.backend.rest.dtos.websocket;

public class TravelResumedEvent {
    private String travelId;
    private String playerId;
    private String playerShipId;
    private String reason;

    public TravelResumedEvent(String travelId, String playerId, String playerShipId, String reason) {
        this.travelId = travelId;
        this.playerId = playerId;
        this.playerShipId = playerShipId;
        this.reason = reason;
    }

    public String getTravelId() {
        return travelId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getPlayerShipId() {
        return playerShipId;
    }

    public String getReason() {
        return reason;
    }
}
