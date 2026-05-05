package at.fhv.backend.rest.dtos.route.response;

import java.util.List;
import java.util.UUID;

public record RouteResponseDTO(
        UUID id,
        UUID originPortId,
        UUID destinationPortId,
        List<WaypointDTO> waypoints,
        double distance,
        String description
) {
    public record WaypointDTO(double x, double y) {}
}
