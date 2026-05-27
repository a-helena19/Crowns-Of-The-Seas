package at.fhv.backend.rest.dtos.websocket;

public class TravelResumedEvent {
    private String travelId;
    private String playerId;
    private String playerShipId;
    private String reason;
    private Integer currentTick;
    private Integer startTick;
    private Integer arrivalTick;
    private Double originX;
    private Double originY;
    private Double destX;
    private Double destY;

    public TravelResumedEvent(String travelId, String playerId, String playerShipId, String reason) {
        this.travelId = travelId;
        this.playerId = playerId;
        this.playerShipId = playerShipId;
        this.reason = reason;
    }

    public TravelResumedEvent(String travelId, String playerId, String playerShipId, String reason,
                              Integer currentTick, Integer startTick, Integer arrivalTick,
                              Double originX, Double originY, Double destX, Double destY) {
        this(travelId, playerId, playerShipId, reason);
        this.currentTick = currentTick;
        this.startTick = startTick;
        this.arrivalTick = arrivalTick;
        this.originX = originX;
        this.originY = originY;
        this.destX = destX;
        this.destY = destY;
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

    public Integer getCurrentTick() {
        return currentTick;
    }

    public Integer getStartTick() {
        return startTick;
    }

    public Integer getArrivalTick() {
        return arrivalTick;
    }

    public Double getOriginX() {
        return originX;
    }

    public Double getOriginY() {
        return originY;
    }

    public Double getDestX() {
        return destX;
    }

    public Double getDestY() {
        return destY;
    }
}
