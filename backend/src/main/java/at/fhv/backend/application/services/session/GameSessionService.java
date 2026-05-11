package at.fhv.backend.application.services.session;

import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface GameSessionService {
    SessionDTO createSession(UUID hostUserId, String hostName, int maxPlayers, int tickRateSeconds, int totalTicks, Duration duration);
    SessionDTO joinSession(String gameCode, UUID userId, String playerName);
    SessionDTO startGame(UUID sessionId, UUID hostUserId);
    SessionDTO changeTickRate(UUID sessionId, UUID hostUserId, int tickRateSeconds);
    List<SessionDTO> getActiveSessionsForUser(UUID userId);
    SessionDTO leaveSession(UUID sessionId, UUID userId);
    void assignPlayerFaction(UUID sessionId, UUID userId, String factionName);
    Optional<PlayerFaction> getPlayerFaction(UUID sessionId, UUID userId);
    void markPlayerReady(UUID sessionId, UUID userId);
    Map<String, Object> getSessionReadyStatus(UUID sessionId);
}
