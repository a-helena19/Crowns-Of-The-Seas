package at.fhv.backend.rest.dtos.ship.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PortEstimateRequest {
    @NotNull
    private UUID playerShipId;
    @NotNull
    private UUID destinationPortId;

    public PortEstimateRequest() {}

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public UUID getDestinationPortId() {
        return destinationPortId;
    }

    public void setDestinationPortId(UUID destinationPortId) {
        this.destinationPortId = destinationPortId;
    }
}
