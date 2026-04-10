package at.fhv.backend.rest.dtos.websocket;

import java.util.UUID;

public record PlayerInfo(
        UUID userId,
        String playerName,
        boolean isHost
) {}

