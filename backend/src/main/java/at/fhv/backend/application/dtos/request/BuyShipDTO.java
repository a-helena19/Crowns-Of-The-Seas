package at.fhv.backend.application.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class BuyShipDTO {
    @NotNull(message = "ShipId cannot be null.")
    private UUID shipId;

    @NotBlank(message = "Custom name cannot be blank.")
    private String customName;

    public BuyShipDTO() {}

    public UUID getShipId() {
        return shipId;
    }

    public void setShipId(UUID shipId) {
        this.shipId = shipId;
    }

    public String getCustomName() {
        return customName;
    }

    public void setCustomName(String customName) {
        this.customName = customName;
    }
}