package at.fhv.backend.rest.dtos.session.request;

import java.util.UUID;

public record CreateSessionRequest(
        UUID hostUserId,
        String hostName,
        int maxPlayers,
        int tickRateSeconds,
        String duration) {}
