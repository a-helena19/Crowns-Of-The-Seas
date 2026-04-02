package at.fhv.backend.rest.dtos.session.request;

import java.util.UUID;

public record JoinSessionRequest(
        String gameCode,
        UUID userId,
        String playerName
) {}
