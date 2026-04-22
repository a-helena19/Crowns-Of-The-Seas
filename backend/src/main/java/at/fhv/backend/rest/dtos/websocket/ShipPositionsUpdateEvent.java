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
            // Routen-Daten für client-seitige Echtzeit-Interpolation
            Double originX,
            Double originY,
            Double destX,
            Double destY,
            Integer startTick
    ) {}
}
