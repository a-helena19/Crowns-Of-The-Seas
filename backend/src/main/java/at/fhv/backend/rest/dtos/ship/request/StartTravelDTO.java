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

    @NotNull(message = "sessionCargoId cannot be null.")
    private UUID sessionCargoId;

    @DecimalMin(value = "0.25", message = "speedSetting must be over 0.25.")
    @DecimalMax(value = "1.0", message = "speedSetting must be max 1.0.")
    private double speedSetting = 1.0;

    private boolean pilotageService = false;

    private boolean miniGameFailedDeparture = false;

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

    public UUID getSessionCargoId() {
        return sessionCargoId;
    }

    public void setSessionCargoId(UUID sessionCargoId) {
        this.sessionCargoId = sessionCargoId;
    }

    public double getSpeedSetting() {
        return speedSetting;
    }

    public void setSpeedSetting(double speedSetting) {
        this.speedSetting = speedSetting;
    }

    public boolean isPilotageService() {
        return pilotageService;
    }

    public void setPilotageService(boolean pilotageService) {
        this.pilotageService = pilotageService;
    }

    public boolean isMiniGameFailedDeparture() {
        return miniGameFailedDeparture;
    }

    public void setMiniGameFailedDeparture(boolean miniGameFailedDeparture) {
        this.miniGameFailedDeparture = miniGameFailedDeparture;
    }
}
