package at.fhv.backend.rest.dtos.ship.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class StartTravelDTO {
    @NotNull(message = "playerShipId cannot be null.")
    private UUID playerShipId;

    @NotNull(message = "destinationPortId cannot be empty.")
    private UUID destinationPortId;

    @DecimalMin(value = "0.5", message = "speedSetting must be over 0.5.")
    @DecimalMax(value = "1.0", message = "speedSetting must be max 1.0.")
    private double speedSetting = 1.0;

    public StartTravelDTO() {}



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

    public double getSpeedSetting() {
        return speedSetting;
    }

    public void setSpeedSetting(double speedSetting) {
        this.speedSetting = speedSetting;
    }
}
