package at.fhv.backend.application.services.session;

import at.fhv.backend.rest.dtos.session.response.SessionDTO;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

public interface GameSessionService {
    SessionDTO createSession(UUID hostUserId, String hostName, int maxPlayers, int tickRateSeconds, int totalTicks, Duration duration);
    SessionDTO joinSession(String gameCode, UUID userId, String playerName);
    SessionDTO startGame(UUID sessionId, UUID hostUserId);
    SessionDTO changeTickRate(UUID sessionId, UUID hostUserId, int tickRateSeconds);
    List<SessionDTO> getActiveSessionsForUser(UUID userId);

    // TODO: Implement leaveSession and assignFaction methods in the future
    // SessionDTO assignFaction(UUID sessionId, UUID userId, PlayerFaction faction)
}
