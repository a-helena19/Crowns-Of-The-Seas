package at.fhv.backend.rest.dtos.ship.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class BuyShipDTO {
    @NotNull(message = "ShipId cannot be null.")
    private UUID shipId;

    public BuyShipDTO() {}

    public UUID getShipId() {
        return shipId;
    }

    public void setShipId(UUID shipId) {
        this.shipId = shipId;
    }
}