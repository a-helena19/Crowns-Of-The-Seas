package at.fhv.backend.port.application.dto;

import java.util.UUID;

public record PortResponseDTO(
        UUID id,
        String name,
        double x,
        double y
) {}
