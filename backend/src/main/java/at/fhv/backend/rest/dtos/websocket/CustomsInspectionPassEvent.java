package at.fhv.backend.rest.dtos.websocket;

public class CustomsInspectionPassEvent {
    private String inspectionId;
    private String playerId;
    private String travelId;
    private String playerShipId;
    private String shipName;
    private String originPortName;
    private String destinationPortName;
    private String outcome;

    public CustomsInspectionPassEvent(String inspectionId, String playerId, String travelId,
                                      String playerShipId, String shipName, String originPortName,
                                      String destinationPortName, String outcome) {
        this.inspectionId = inspectionId;
        this.playerId = playerId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.shipName = shipName;
        this.originPortName = originPortName;
        this.destinationPortName = destinationPortName;
        this.outcome = outcome;
    }

    public String getInspectionId() {
        return inspectionId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getTravelId() {
        return travelId;
    }

    public String getPlayerShipId() {
        return playerShipId;
    }

    public String getShipName() {
        return shipName;
    }

    public String getOriginPortName() {
        return originPortName;
    }

    public String getDestinationPortName() {
        return destinationPortName;
    }

    public String getOutcome() {
        return outcome;
    }
}
