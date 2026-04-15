package at.fhv.backend.rest.dtos.websocket;

import java.util.List;
import java.util.UUID;

public record PortsUpdateEvent(
        String eventType,
        List<PortInfo> ports
) {
    public record PortInfo(UUID id, String name, double x, double y) {}
}
