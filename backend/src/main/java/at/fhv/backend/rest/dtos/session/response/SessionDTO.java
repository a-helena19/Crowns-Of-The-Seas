package at.fhv.backend.rest.dtos.session.response;

import java.util.List;
import java.util.UUID;

public record SessionDTO(
        UUID id,
        String gameCode,
        String status,
        int maxPlayers,
        int tickRateSeconds,
        List<SessionPlayerDTO> players
) {}