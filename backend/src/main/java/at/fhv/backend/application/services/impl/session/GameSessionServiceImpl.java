package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.application.dtos.mapper.session.SessionDTOMapper;
import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.player.exception.InvalidFactionException;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.port.exception.PortNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.SessionStatus;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.websocket.PortsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameSessionServiceImpl implements GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final SessionDTOMapper sessionDTOMapper;
    private final GameSessionWebSocketController webSocketController;
    private final PortQueryService portQueryService;
    private final PortRepository portRepository;
    private final GameTickScheduler gameTickScheduler;
    private final CargoSessionInitializer cargoSessionInitializer;

    public GameSessionServiceImpl(GameSessionRepository gameSessionRepository,
                                  SessionDTOMapper sessionDTOMapper,
                                  GameSessionWebSocketController webSocketController,
                                  PortQueryService portQueryService,
                                  PortRepository portRepository,
                                  GameTickScheduler gameTickScheduler,
                                  CargoSessionInitializer cargoSessionInitializer) {
        this.sessionDTOMapper = sessionDTOMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.webSocketController = webSocketController;
        this.portQueryService = portQueryService;
        this.portRepository = portRepository;
        this.gameTickScheduler = gameTickScheduler;
        this.cargoSessionInitializer = cargoSessionInitializer;
    }

    private void broadcastSessionUpdate(GameSession session, String type) {
        broadcastSessionUpdate(session, type, null, null);
    }

    private void broadcastSessionUpdate(GameSession session, String type, String affectedPlayerName) {
        broadcastSessionUpdate(session, type, affectedPlayerName, null);
    }

    private void broadcastSessionUpdate(GameSession session, String type,
                                        String affectedPlayerName, UUID affectedUserId) {
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
                                p.isHost(),
                                session.getPlayerFactions().get(p.getUserId()) != null
                                        ? session.getPlayerFactions().get(p.getUserId()).name()
                                        : null,
                                session.getPlayerHomePorts().get(p.getUserId()),
                                session.getReadyPlayers().contains(p.getUserId()),
                                session.isPlayerDisconnected(p.getUserId())))
                        .collect(Collectors.toList()),
                type,
                affectedPlayerName,
                affectedUserId
        );
        webSocketController.broadcastSessionUpdate(session.getId().toString(), event);
    }

    @Override
    public SessionDTO createSession(UUID hostUserId, String hostName, int maxPlayers,
                                    int tickRateSeconds, int totalTicks, Duration duration) {
        GameSession session = new GameSession(hostUserId, maxPlayers, tickRateSeconds, totalTicks, duration);
        ISessionPlayer host = new BaseSessionPlayer(hostUserId, session.getId(), hostName, true);
        session.addPlayer(host);
        return sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));
    }

    @Override
    @Transactional
    public SessionDTO joinSession(String gameCode, UUID userId, String playerName) {
        GameSession session = gameSessionRepository.findByGameCode(gameCode)
                .orElseThrow(() -> new SessionNotFoundException(gameCode));

        // War der Spieler bereits Teil dieser Session (z.B. nach dem Verlassen einer
        // laufenden Partie)? Dann ist dies ein Wieder-Beitritt: Daten bleiben erhalten.
        if (session.isPlayerInSession(userId)) {
            return rejoinSession(session.getId(), userId);
        }

        // Neuer Spieler: regulärer Beitritt (nur in LOBBY erlaubt – addPlayer wirft
        // andernfalls die passende Exception, sodass Fremde keiner laufenden Session
        // beitreten können).
        ISessionPlayer player = new BaseSessionPlayer(userId, session.getId(), playerName, false);
        session.addPlayer(player);
        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        broadcastSessionUpdate(session, "PLAYER_JOINED");

        return savedSession;
    }

    @Override
    @Transactional
    public SessionDTO startGame(UUID sessionId, UUID hostUserId) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        if (session.getStatus() == SessionStatus.FACTION_SELECTION) {
            return sessionDTOMapper.sessionToDTO(session);
        }

        session.beginFactionSelection(hostUserId);
        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        broadcastSessionUpdate(session, "GAME_TRANSITION_STARTED");

        return savedSession;
    }

    @Override
    @Transactional
    public SessionDTO changeTickRate(UUID sessionId, UUID hostUserId, int tickRateSeconds) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
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
    public SessionDTO getSession(UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        return sessionDTOMapper.sessionToDTO(session);
    }

    @Override
    @Transactional
    public SessionDTO leaveSession(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        // Namen des verlassenden Spielers merken (für die Benachrichtigung).
        String leavingPlayerName = session.getPlayers().stream()
                .filter(p -> p.getUserId().equals(userId))
                .map(ISessionPlayer::getPlayerName)
                .findFirst()
                .orElse(null);

        boolean wasHost = session.getHostUserId().equals(userId);

        // Spieler als "getrennt" markieren – funktioniert auch in einer laufenden
        // Session. Der Spieler bleibt mit allen Daten (Fraktion, Heimathafen,
        // Kontostand) erhalten, ebenso seine Schiffe & Cargos, damit er später
        // wieder beitreten kann.
        session.leave(userId);

        // Kein verbundener Spieler mehr übrig → Session beenden und Tick stoppen.
        if (session.getConnectedPlayerCount() == 0) {
            gameTickScheduler.stopForSession(session.getId());
            gameSessionRepository.deleteById(session.getId());
            return null;
        }

        // Host hat verlassen → ersten verbundenen Spieler zum neuen Host machen.
        if (wasHost) {
            session.getPlayers().stream()
                    .filter(p -> session.isPlayerConnected(p.getUserId()))
                    .findFirst()
                    .ifPresent(newHost -> session.makePlayerHost(newHost.getUserId()));
        }

        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        // Verbleibende Spieler benachrichtigen, dass der Spieler die Session verlassen hat.
        broadcastSessionUpdate(session, "PLAYER_LEFT", leavingPlayerName, userId);

        return savedSession;
    }

    @Override
    @Transactional
    public SessionDTO rejoinSession(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        // rejoin() prüft selbst: Session muss RUNNING sein und der Spieler muss
        // vorher bereits Teil der Session gewesen sein (Fremde können einer
        // laufenden Session nicht beitreten → PlayerNotFoundException).
        session.rejoin(userId);

        SessionDTO savedSession = sessionDTOMapper.sessionToDTO(gameSessionRepository.save(session));

        // Hinweis: Das PLAYER_REJOINED-Event wird NICHT hier gesendet, sondern erst,
        // wenn der zurückkehrende Client tatsächlich per WebSocket subscribed ist
        // (siehe notifyPlayerRejoined / GameSessionWebSocketController). Andernfalls
        // würde die Nachricht gesendet, bevor irgendein Client sie empfangen kann
        // (STOMP-Topics haben kein Replay).

        return savedSession;
    }

    @Override
    public void notifyPlayerRejoined(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElse(null);
        if (session == null) return;

        // Nur benachrichtigen, wenn der Spieler tatsächlich (wieder) verbunden ist.
        if (!session.isPlayerConnected(userId)) return;

        String rejoiningPlayerName = session.getPlayers().stream()
                .filter(p -> p.getUserId().equals(userId))
                .map(ISessionPlayer::getPlayerName)
                .findFirst()
                .orElse(null);

        // Andere Spieler benachrichtigen, dass der Spieler wieder beigetreten ist.
        broadcastSessionUpdate(session, "PLAYER_REJOINED", rejoiningPlayerName, userId);

        // Aktuellen Spielstand (Schiffspositionen) sofort senden, damit der
        // wiederbeigetretene Client umgehend den aktuellen Stand sieht.
        gameTickScheduler.triggerImmediateBroadcast(sessionId);
    }

    @Override
    @Transactional
    public void assignPlayerFaction(UUID sessionId, UUID userId, String factionName) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        try {
            PlayerFaction faction = PlayerFaction.valueOf(factionName.toUpperCase());
            session.assignPlayerFaction(userId, faction);
            gameSessionRepository.save(session);

            broadcastSessionUpdate(session, "PLAYER_FACTION_ASSIGNED");

        } catch (IllegalArgumentException e) {
            throw new InvalidFactionException(factionName);
        }
    }

    @Override
    public Optional<PlayerFaction> getPlayerFaction(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        return session.getPlayerFaction(userId);
    }

    @Override
    @Transactional
    public void assignHomePort(UUID sessionId, UUID userId, UUID portId) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        if (!portRepository.existsById(PortId.of(portId))) {
            throw new PortNotFoundException(PortId.of(portId));
        }

        session.assignHomePort(userId, portId);
        gameSessionRepository.save(session);

        broadcastSessionUpdate(session, "PLAYER_HOME_PORT_ASSIGNED");
    }

    @Override
    public Optional<UUID> getHomePort(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        return session.getHomePort(userId);
    }

    @Override
    @Transactional
    public void markPlayerReady(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        session.markPlayerReady(userId);

        boolean shouldAutoStart = session.areAllPlayersReady()
                && session.getStatus() == SessionStatus.FACTION_SELECTION;

        if (shouldAutoStart) {
            session.start(session.getHostUserId());
        }

        gameSessionRepository.save(session);

        broadcastSessionUpdate(session, "PLAYER_READY");

        if (shouldAutoStart) {
            finalizeGameStart(session);
        }
    }


    private void finalizeGameStart(GameSession session) {
        UUID sessionId = session.getId();

        gameTickScheduler.startForSession(sessionId, session.getTickRateSeconds());
        cargoSessionInitializer.initializeForSession(sessionId);

        List<PortResponseDTO> ports = portQueryService.findAll();
        PortsUpdateEvent portsEvent = new PortsUpdateEvent(
                "PORTS_UPDATE",
                ports.stream()
                        .map(p -> new PortsUpdateEvent.PortInfo(p.id(), p.name(), p.x(), p.y()))
                        .toList()
        );
        webSocketController.broadcastPortsUpdate(sessionId.toString(), portsEvent);

        broadcastSessionUpdate(session, "GAME_STARTED");
    }

    @Override
    public Map<String, Object> getSessionReadyStatus(UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        return Map.of(
                "sessionId", sessionId,
                "readyPlayers", session.getReadyPlayers(),
                "totalPlayers", session.getPlayers().size(),
                "allReady", session.areAllPlayersReady()
        );
    }
}