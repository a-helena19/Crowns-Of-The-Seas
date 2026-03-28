package at.fhv.backend.domain.model.exception;

import java.util.UUID;

public class ShipNotOwnedException extends DomainException {
    private final UUID shipId;

    public ShipNotOwnedException(String message, UUID shipId) {
        super(message, ErrorCode.SHIP_NOT_OWNED_BY_PLAYER);
        this.shipId = shipId;
    }

    public UUID getShipId() {
        return shipId;
    }
}
