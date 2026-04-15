package at.fhv.backend.rest.dtos.port;

import java.util.UUID;

public record PortResponseDTO(
        UUID id,
        String name,
        double x,
        double y
) {}
