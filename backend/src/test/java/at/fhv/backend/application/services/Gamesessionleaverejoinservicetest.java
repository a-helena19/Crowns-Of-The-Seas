package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.session.SessionDTOMapperImpl;
import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.chat.SessionChatService;
import at.fhv.backend.application.services.impl.session.GameSessionServiceImpl;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.SessionStatus;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameSessionLeaveRejoinServiceTest {

    @Mock
    private GameSessionRepository gameSessionRepository;
    @Mock
    private GameSessionWebSocketController webSocketController;
    @Mock
    private PortQueryService portQueryService;
    @Mock
    private at.fhv.backend.domain.model.port.PortRepository portRepository;
    @Mock
    private GameTickScheduler gameTickScheduler;
    @Mock
    private CargoSessionInitializer cargoSessionInitializer;
    @Mock
    private SessionChatService sessionChatService;

    private GameSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GameSessionServiceImpl(gameSessionRepository, new SessionDTOMapperImpl(),
                webSocketController, portQueryService, portRepository, gameTickScheduler,
                cargoSessionInitializer, sessionChatService);
    }

    // Hilfsmethode: laufende Session mit Host + Gast.
    private GameSession buildRunningSession(UUID hostId, UUID guestId) {
        GameSession session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.addPlayer(new BaseSessionPlayer(guestId, session.getId(), "Guest", false));
        session.beginFactionSelection(hostId);
        session.start(hostId);
        return session;
    }

    private void mockLockAndSave(GameSession session) {
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ── leaveSession ──

    @Test
    void givenRunningSession_whenGuestLeaves_thenPlayerLeftIsBroadcast() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        mockLockAndSave(session);

        service.leaveSession(session.getId(), guestId);

        ArgumentCaptor<SessionUpdateEvent> captor = ArgumentCaptor.forClass(SessionUpdateEvent.class);
        verify(webSocketController).broadcastSessionUpdate(eq(session.getId().toString()), captor.capture());
        assertThat(captor.getValue().type()).isEqualTo("PLAYER_LEFT");
        assertThat(captor.getValue().affectedPlayerName()).isEqualTo("Guest");
        assertThat(captor.getValue().affectedUserId()).isEqualTo(guestId);
    }

    @Test
    void givenRunningSession_whenGuestLeaves_thenSessionIsSavedNotDeleted() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        mockLockAndSave(session);

        service.leaveSession(session.getId(), guestId);

        verify(gameSessionRepository, times(1)).save(any(GameSession.class));
        verify(gameSessionRepository, never()).deleteById(any());
        verify(gameTickScheduler, never()).stopForSession(any());
    }

    @Test
    void givenHostLeaves_thenAnotherConnectedPlayerBecomesHost() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        mockLockAndSave(session);

        service.leaveSession(session.getId(), hostId);

        // Der Gast ist jetzt Host.
        assertThat(session.getHostUserId()).isEqualTo(guestId);
        ISessionPlayer guest = session.getPlayers().stream()
                .filter(p -> p.getUserId().equals(guestId)).findFirst().orElseThrow();
        assertThat(guest.isHost()).isTrue();
    }

    @Test
    void givenLastConnectedPlayerLeaves_thenSessionEndsAndTickStops() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        mockLockAndSave(session);

        // Erst Gast, dann Host verlassen → kein verbundener Spieler mehr.
        service.leaveSession(session.getId(), guestId);
        SessionDTO result = service.leaveSession(session.getId(), hostId);

        assertThat(result).isNull();
        verify(gameTickScheduler).stopForSession(session.getId());
        verify(gameSessionRepository).deleteById(session.getId());
    }

    // ── rejoinSession ──

    @Test
    void givenDisconnectedPlayer_whenRejoin_thenPlayerIsConnectedAndSaved() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        session.leave(guestId);

        service.rejoinSession(session.getId(), guestId);

        assertThat(session.isPlayerConnected(guestId)).isTrue();
        verify(gameSessionRepository).save(session);
    }

    @Test
    void givenRejoin_thenNoBroadcastYet() {
        // Das PLAYER_REJOINED-Event wird erst beim WS-Subscribe gesendet, nicht hier.
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        session.leave(guestId);

        service.rejoinSession(session.getId(), guestId);

        verify(webSocketController, never()).broadcastSessionUpdate(any(), any());
        verify(gameTickScheduler, never()).triggerImmediateBroadcast(any());
    }

    @Test
    void givenStranger_whenRejoin_thenThrowsPlayerNotFoundException() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));
        UUID stranger = UUID.randomUUID();

        assertThatThrownBy(() -> service.rejoinSession(session.getId(), stranger))
                .isInstanceOf(PlayerNotFoundException.class);
    }

    @Test
    void givenNonRunningSession_whenRejoin_thenThrowsSessionNotRunningException() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        // Session in LOBBY belassen.
        GameSession session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.addPlayer(new BaseSessionPlayer(guestId, session.getId(), "Guest", false));
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.rejoinSession(session.getId(), guestId))
                .isInstanceOf(SessionNotRunningException.class);
    }

    // ── notifyPlayerRejoined ──

    @Test
    void givenReconnectedPlayer_whenNotify_thenPlayerRejoinedIsBroadcast() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        // Spieler hat verlassen und ist bereits wieder verbunden.
        session.leave(guestId);
        session.rejoin(guestId);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        service.notifyPlayerRejoined(session.getId(), guestId);

        ArgumentCaptor<SessionUpdateEvent> captor = ArgumentCaptor.forClass(SessionUpdateEvent.class);
        verify(webSocketController).broadcastSessionUpdate(eq(session.getId().toString()), captor.capture());
        assertThat(captor.getValue().type()).isEqualTo("PLAYER_REJOINED");
        assertThat(captor.getValue().affectedPlayerName()).isEqualTo("Guest");
        assertThat(captor.getValue().affectedUserId()).isEqualTo(guestId);
        verify(gameTickScheduler).triggerImmediateBroadcast(session.getId());
    }

    @Test
    void givenDisconnectedPlayer_whenNotify_thenNoBroadcast() {
        // notifyPlayerRejoined benachrichtigt nur, wenn der Spieler wirklich verbunden ist.
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        session.leave(guestId); // bleibt getrennt
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        service.notifyPlayerRejoined(session.getId(), guestId);

        verify(webSocketController, never()).broadcastSessionUpdate(any(), any());
    }

    @Test
    void givenUnknownSession_whenNotify_thenSilentlyIgnored() {
        UUID sessionId = UUID.randomUUID();
        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Darf keine Exception werfen.
        service.notifyPlayerRejoined(sessionId, UUID.randomUUID());

        verify(webSocketController, never()).broadcastSessionUpdate(any(), any());
    }

    // ── joinSession leitet frühere Mitglieder auf Rejoin um ──

    @Test
    void givenFormerMemberUsesCode_whenJoinRunningSession_thenRejoinedAndReconnected() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        session.leave(guestId);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.findByIdWithLock(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.joinSession(session.getGameCode(), guestId, "Guest");

        // Über den Code-Pfad wurde der Spieler wieder verbunden (Rejoin), nicht neu angelegt.
        assertThat(session.isPlayerConnected(guestId)).isTrue();
        assertThat(session.getPlayers()).hasSize(2);
    }

    @Test
    void givenRunningSession_whenStrangerUsesCode_thenCannotJoin() {
        UUID hostId = UUID.randomUUID();
        UUID guestId = UUID.randomUUID();
        GameSession session = buildRunningSession(hostId, guestId);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        UUID stranger = UUID.randomUUID();

        // Fremde können einer laufenden Session nicht beitreten (addPlayer wirft).
        assertThatThrownBy(() -> service.joinSession(session.getGameCode(), stranger, "Eve"))
                .isInstanceOf(at.fhv.backend.domain.model.session.exception.SessionNotInLobbyException.class);
        assertThat(session.isPlayerInSession(stranger)).isFalse();
        assertThat(session.getStatus()).isEqualTo(SessionStatus.RUNNING);
    }
}
