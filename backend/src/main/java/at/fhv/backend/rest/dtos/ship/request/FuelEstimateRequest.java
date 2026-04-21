package at.fhv.backend.rest.dtos.ship.request;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public class FuelEstimateRequest {
    @NotNull
    private UUID playerShipId;
    @NotNull
    private UUID sessionCargoId;

    public FuelEstimateRequest() {}

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public UUID getSessionCargoId() {
        return sessionCargoId;
    }

    public void setSessionCargoId(UUID sessionCargoId) {
        this.sessionCargoId = sessionCargoId;
    }
}
