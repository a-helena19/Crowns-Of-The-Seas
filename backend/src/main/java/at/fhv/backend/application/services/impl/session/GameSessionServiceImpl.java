package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.application.dtos.mapper.session.SessionDTOMapper;
import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.websocket.PortsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final SessionDTOMapper sessionDTOMapper;
    private final GameSessionWebSocketController webSocketController;
    private final PortQueryService portQueryService;
    private final GameTickScheduler gameTickScheduler;
    private final CargoSessionInitializer cargoSessionInitializer;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository,
                                  SessionDTOMapper sessionDTOMapper,
                                  GameSessionWebSocketController webSocketController,
                                  PortQueryService portQueryService,
                                  GameTickScheduler gameTickScheduler,
                                  CargoSessionInitializer cargoSessionInitializer) {
        this.sessionDTOMapper = sessionDTOMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.webSocketController = webSocketController;
        this.portQueryService = portQueryService;
        this.gameTickScheduler = gameTickScheduler;
        this.cargoSessionInitializer = cargoSessionInitializer;
    }

    @Override
    public SessionDTO createSession(UUID hostUserId, String hostName, int maxPlayers, int tickRateSeconds, int totalTicks, Duration duration) {
        GameSession session = new GameSession(hostUserId, maxPlayers, tickRateSeconds, totalTicks, duration);
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
        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        // Broadcast update to all connected clients
        SessionUpdateEvent event = new SessionUpdateEvent(
                session.getId(),
                session.getGameCode(),
                session.getStatus().toString(),
                session.getPlayers().size(),
                session.getMaxPlayers(),
                session.getPlayers().stream()
                        .map(p -> new SessionUpdateEvent.PlayerInfo(
                                p.getUserId(),
                                p.getPlayerName(),
                                p.isHost()))
                        .collect(Collectors.toList()),
                "PLAYER_JOINED"
        );
        // Use sessionId (UUID) not gameCode for WebSocket topic!
        webSocketController.broadcastSessionUpdate(session.getId().toString(), event);

        return savedSession;
    }

    @Override
    public SessionDTO startGame(UUID sessionId, UUID hostUserId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.start(hostUserId);
        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        // Broadcast update to all connected clients
        SessionUpdateEvent event = new SessionUpdateEvent(
                session.getId(),
                session.getGameCode(),
                session.getStatus().toString(),
                session.getPlayers().size(),
                session.getMaxPlayers(),
                session.getPlayers().stream()
                        .map(p -> new SessionUpdateEvent.PlayerInfo(
                                p.getUserId(),
                                p.getPlayerName(),
                                p.isHost()))
                        .collect(Collectors.toList()),
                "GAME_STARTED"
        );
        webSocketController.broadcastSessionUpdate(session.getId().toString(), event);

        cargoSessionInitializer.initializeForSession(sessionId);
        gameTickScheduler.startForSession(session.getId(), session.getTickRateSeconds());

        List<PortResponseDTO> ports = portQueryService.findAll();
        PortsUpdateEvent portsEvent = new PortsUpdateEvent(
                "PORTS_UPDATE",
                ports.stream()
                        .map(p -> new PortsUpdateEvent.PortInfo(p.id(), p.name(), p.x(), p.y()))
                        .toList()
        );
        webSocketController.broadcastPortsUpdate(session.getId().toString(), portsEvent);

        return savedSession;
    }

    @Override
    public SessionDTO changeTickRate(UUID sessionId, UUID hostUserId, int tickRateSeconds) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.changeTickRate(hostUserId, tickRateSeconds);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    @Override
    public List<SessionDTO> getActiveSessionsForUser(UUID userId) {
        return gameSessionRepository.findActiveSessionsByUserId(userId)
                .stream()
                .map(sessionDTOMapper::sessionToDTO)
                .toList();
    }

    @Override
    public SessionDTO leaveSession(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        // Check if leaving player is host
        boolean wasHost = session.getPlayers().stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.isHost());

        session.removePlayer(userId);

        // If session is now empty, delete it
        if (session.getPlayers().isEmpty()) {
            gameSessionRepository.deleteById(session.getId());
            return null; // or throw exception
        }

        // If host left and other players remain, transfer host to next player
        if (wasHost && !session.getPlayers().isEmpty()) {
            ISessionPlayer newHost = session.getPlayers().get(0);
            // Need to add method: session.makePlayerHost(newHost.getUserId());
            session.makePlayerHost(newHost.getUserId());
        }

        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        // Broadcast update
        SessionUpdateEvent event = new SessionUpdateEvent(
                session.getId(),
                session.getGameCode(),
                session.getStatus().toString(),
                session.getPlayers().size(),
                session.getMaxPlayers(),
                session.getPlayers().stream()
                        .map(p -> new SessionUpdateEvent.PlayerInfo(
                                p.getUserId(),
                                p.getPlayerName(),
                                p.isHost()))
                        .collect(Collectors.toList()),
                "PLAYER_LEFT"
        );
        webSocketController.broadcastSessionUpdate(session.getId().toString(), event);

        return savedSession;
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
