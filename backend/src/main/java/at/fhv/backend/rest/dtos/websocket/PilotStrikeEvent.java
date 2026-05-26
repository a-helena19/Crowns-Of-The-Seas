package at.fhv.backend.rest.dtos.websocket;

import java.util.List;
import java.util.UUID;

public record PilotStrikeEvent(
        String eventType,
        UUID portId,
        String portName,
        Integer endTick,
        List<RevokedTravel> revokedTravels
) {
    public record RevokedTravel(UUID travelId, UUID playerId) {}

    public static PilotStrikeEvent started(UUID portId, String portName, int endTick,
                                           List<RevokedTravel> revokedTravels) {
        return new PilotStrikeEvent("PILOT_STRIKE_STARTED", portId, portName, endTick, revokedTravels);
    }

    public static PilotStrikeEvent ended(UUID portId, String portName) {
        return new PilotStrikeEvent("PILOT_STRIKE_ENDED", portId, portName, null, List.of());
    }
}
