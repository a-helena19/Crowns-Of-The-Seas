package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.session.SessionDTOMapper;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final SessionDTOMapper sessionDTOMapper;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository, SessionDTOMapper sessionDTOMapper) {
        this.sessionDTOMapper = sessionDTOMapper;
        this.gameSessionRepository = gameSessionRepository;
    }

    @Override
    public SessionDTO createSession(UUID hostUserId, String hostName, int maxPlayers, int tickRateSeconds, Duration duration) {
        GameSession session = new GameSession(hostUserId, maxPlayers, tickRateSeconds, duration);
        ISessionPlayer host = new BaseSessionPlayer(
                hostUserId, session.getId(), hostName, true);
        session.addPlayer(host);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    @Override
    public SessionDTO joinSession(String gameCode, UUID userId, String playerName) {
        GameSession session = gameSessionRepository.findByGameCode(gameCode)
                .orElseThrow(() -> new SessionNotFoundException(gameCode));
        ISessionPlayer player = new BaseSessionPlayer(
                userId, session.getId(), playerName, false);
        session.addPlayer(player);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    @Override
    public SessionDTO startGame(UUID sessionId, UUID hostUserId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.start(hostUserId);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    @Override
    public SessionDTO changeTickRate(UUID sessionId, UUID hostUserId, int tickRateSeconds) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.changeTickRate(hostUserId, tickRateSeconds);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    /*
    // TODO: remove this commented out code once faction is needed in sprint2
    @Override
    public SessionDTO assignFaction(UUID sessionId, UUID userId,
                                    PlayerFaction faction) {
        GameSession session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.assignPlayerFaction(userId, faction);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }
     */
}
