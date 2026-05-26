package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;
import java.util.List;

public class CustomsInspectionDialogEvent {
    private String inspectionId;
    private String playerId;
    private String travelId;
    private String playerShipId;
    private String shipName;
    private String originPortName;
    private String destinationPortName;
    private BigDecimal fineAmount;
    private BigDecimal bribeCost;
    private int detentionTicks;
    private List<String> illegalCargoLabels;

    public CustomsInspectionDialogEvent(String inspectionId, String playerId, String travelId, String playerShipId,
                                        String shipName, String originPortName, String destinationPortName,
                                        BigDecimal fineAmount, BigDecimal bribeCost, int detentionTicks, List<String> illegalCargoLabels) {
        this.inspectionId = inspectionId;
        this.playerId = playerId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.shipName = shipName;
        this.originPortName = originPortName;
        this.destinationPortName = destinationPortName;
        this.fineAmount = fineAmount;
        this.bribeCost = bribeCost;
        this.detentionTicks = detentionTicks;
        this.illegalCargoLabels = illegalCargoLabels;
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

    public BigDecimal getFineAmount() {
        return fineAmount;
    }

    public BigDecimal getBribeCost() {
        return bribeCost;
    }

    public int getDetentionTicks() {
        return detentionTicks;
    }

    public List<String> getIllegalCargoLabels() {
        return illegalCargoLabels;
    }
}
