package at.fhv.backend.rest.dtos.websocket;

import java.util.UUID;

public class ShipUpdateEvent {
    private UUID playerShipId;
    private String status;

    public ShipUpdateEvent(UUID playerShipId, String status) {
        this.playerShipId = playerShipId;
        this.status = status;
    }

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public String getStatus() {
        return status;
    }
}
