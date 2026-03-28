package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class ShipNotFoundException extends DomainException {
    private final UUID shipId;
    public ShipNotFoundException(String message, UUID shipId) {
        super(message, ErrorCode.SHIP_NOT_FOUND);
        this.shipId = shipId;
    }

    public UUID getShipId() {
        return shipId;
    }
}
