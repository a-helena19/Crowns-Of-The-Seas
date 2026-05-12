package at.fhv.backend.rest.dtos.websocket;

import java.util.List;
import java.util.UUID;

public record ShipPositionsUpdateEvent(
        String eventType,
        int currentTick,
        List<ShipPosition> ships
) {
    public ShipPositionsUpdateEvent(int currentTick, List<ShipPosition> ships) {
        this("SHIP_POSITIONS_UPDATE", currentTick, ships);
    }

    public record ShipPosition(
            UUID playerShipId,
            UUID playerId,
            String playerName,
            String iconUrl,
            double x,
            double y,
            String status,
            Integer arrivalTick,
            Double originX,
            Double originY,
            Double destX,
            Double destY,
            Integer startTick,
            UUID currentPortId,
            boolean paused
    ) {
        public ShipPosition(UUID playerShipId, UUID playerId, String playerName, String iconUrl,
                            double x, double y, String status, Integer arrivalTick,
                            Double originX, Double originY, Double destX, Double destY,
                            Integer startTick, UUID currentPortId) {
            this(playerShipId, playerId, playerName, iconUrl, x, y, status, arrivalTick,
                    originX, originY, destX, destY, startTick, currentPortId, false);
        }
    }
}
