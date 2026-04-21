package at.fhv.backend.rest.dtos.cargo.request;

import java.util.UUID;

public class AcceptCargoRequest {
    private UUID sessionCargoId;
    private UUID playerShipId;
    private UUID playerId;

    public AcceptCargoRequest() {}

    public UUID getSessionCargoId() {
        return sessionCargoId;
    }

    public void setSessionCargoId(UUID sessionCargoId) {
        this.sessionCargoId = sessionCargoId;
    }

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public void setPlayerId(UUID playerId) {
        this.playerId = playerId;
    }
}
