package at.fhv.backend.rest.dtos.websocket;

import java.util.List;
import java.util.UUID;

public record SessionUpdateEvent(
        UUID sessionId,
        String gameCode,
        String status,
        int playerCount,
        int maxPlayers,
        List<PlayerInfo> players,
        String type,
        String affectedPlayerName,
        UUID affectedUserId
) {
    public record PlayerInfo(
            UUID userId,
            String playerName,
            boolean isHost,
            String faction,
            UUID homePortId,
            boolean ready,
            boolean disconnected
    ) {}
}