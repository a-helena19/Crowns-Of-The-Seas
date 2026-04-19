package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.session.SessionDTOMapperImpl;
import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.impl.session.GameSessionServiceImpl;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionFullException;
import at.fhv.backend.domain.model.session.exception.SessionNotInLobbyException;
import at.fhv.backend.domain.model.session.exception.OnlyHostCanStartException;
import at.fhv.backend.domain.model.session.exception.InvalidTickRateException;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameSessionServiceImplTest {

    @Mock
    private GameSessionRepository gameSessionRepository;

    @Mock
    private GameSessionWebSocketController webSocketController;

    @Mock
    private PortQueryService portQueryService;

    @Mock
    private GameTickScheduler gameTickScheduler;

    private GameSessionServiceImpl service;

    @Mock
    private CargoSessionInitializer cargoSessionInitializer;

    @BeforeEach
    void setUp() {
        service = new GameSessionServiceImpl(gameSessionRepository, new SessionDTOMapperImpl(), webSocketController, portQueryService, gameTickScheduler, cargoSessionInitializer);
    }

    // Hilfsmethode: fertige LOBBY-Session ohne Spieler zurückliefern

    private GameSession buildSavedSession(UUID hostId, int maxPlayers) {
        GameSession session = new GameSession(hostId, maxPlayers, 5, 100, Duration.ofMinutes(30));
        ISessionPlayer host = new BaseSessionPlayer(hostId, session.getId(), "Host", true);
        session.addPlayer(host);
        return session;
    }

    // createSession
    @Test
    void givenValidInput_whenCreateSession_thenRepositorySaveIsCalled() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        verify(gameSessionRepository, times(1)).save(any(GameSession.class));
    }

    @Test
    void givenValidInput_whenCreateSession_thenReturnedDTOHasCorrectStatus() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        assertThat(dto.status()).isEqualTo("LOBBY");
    }

    @Test
    void givenValidInput_whenCreateSession_thenReturnedDTOContainsHostPlayer() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        assertThat(dto.players()).hasSize(1);
        assertThat(dto.players().get(0).isHost()).isTrue();
        assertThat(dto.players().get(0).playerName()).isEqualTo("Host");
    }

    @Test
    void givenValidInput_whenCreateSession_thenSessionHasCorrectMaxPlayers() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 6, 5, 100, Duration.ofMinutes(30));

        assertThat(dto.maxPlayers()).isEqualTo(6);
    }

    @Test
    void givenValidInput_whenCreateSession_thenSessionHasCorrectTickRate() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 4, 15, 100, Duration.ofMinutes(30));

        assertThat(dto.tickRateSeconds()).isEqualTo(15);
    }

    // joinSession

    @Test
    void givenValidGameCode_whenJoinSession_thenPlayerIsAdded() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID newUserId = UUID.randomUUID();
        SessionDTO dto = service.joinSession(session.getGameCode(), newUserId, "Alice");

        assertThat(dto.players()).hasSize(2);
        verify(webSocketController, times(1)).broadcastSessionUpdate(anyString(), any());
    }

    @Test
    void givenValidGameCode_whenJoinSession_thenNewPlayerIsNotHost() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.joinSession(session.getGameCode(), UUID.randomUUID(), "Alice");

        boolean newPlayerIsHost = dto.players().stream()
                .filter(p -> p.playerName().equals("Alice"))
                .findFirst()
                .map(p -> p.isHost())
                .orElse(true);
        assertThat(newPlayerIsHost).isFalse();
    }

    @Test
    void givenUnknownGameCode_whenJoinSession_thenThrowsSessionNotFoundException() {
        when(gameSessionRepository.findByGameCode("XXXXXX"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.joinSession("XXXXXX", UUID.randomUUID(), "Bob"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenFullSession_whenJoinSession_thenThrowsSessionFullException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 1); // maxPlayers=1, already has host
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.joinSession(session.getGameCode(), UUID.randomUUID(), "Late"))
                .isInstanceOf(SessionFullException.class);
    }

    // startGame

    @Test
    void givenLobbySession_whenHostStartsGame_thenStatusIsRunning() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.startGame(session.getId(), hostId);

        assertThat(dto.status()).isEqualTo("RUNNING");
        verify(webSocketController, times(1)).broadcastSessionUpdate(anyString(), any());
    }

    @Test
    void givenLobbySession_whenNonHostStartsGame_thenThrowsOnlyHostCanStartException() {
        UUID hostId = UUID.randomUUID();
        UUID nonHostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.startGame(session.getId(), nonHostId))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenUnknownSessionId_whenStartGame_thenThrowsSessionNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(gameSessionRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.startGame(unknownId, UUID.randomUUID()))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenAlreadyRunningSession_whenStartGame_thenThrowsSessionNotInLobbyException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        session.start(hostId);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.startGame(session.getId(), hostId))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    // changeTickRate

    @Test
    void givenLobbySession_whenHostChangesTickRate_thenTickRateIsUpdatedInDTO() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.changeTickRate(session.getId(), hostId, 20);

        assertThat(dto.tickRateSeconds()).isEqualTo(20);
    }

    @Test
    void givenLobbySession_whenNonHostChangesTickRate_thenThrowsOnlyHostCanStartException() {
        UUID hostId = UUID.randomUUID();
        UUID nonHost = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.changeTickRate(session.getId(), nonHost, 10))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenLobbySession_whenInvalidTickRate_thenThrowsInvalidTickRateException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.changeTickRate(session.getId(), hostId, 0))
                .isInstanceOf(InvalidTickRateException.class);
    }

    @Test
    void givenUnknownSessionId_whenChangeTickRate_thenThrowsSessionNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(gameSessionRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeTickRate(unknownId, UUID.randomUUID(), 10))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenRunningSession_whenChangeTickRate_thenThrowsSessionNotInLobbyException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        session.start(hostId);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.changeTickRate(session.getId(), hostId, 10))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    // Zusätzliche Tests für erweiterte Szenarien

    @Test
    void givenValidGameCode_whenJoinSession_thenBroadcastHasSessionUpdateEvent() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID newUserId = UUID.randomUUID();
        service.joinSession(session.getGameCode(), newUserId, "Bob");

        verify(webSocketController, times(1))
                .broadcastSessionUpdate(eq(session.getId().toString()), any());
    }

    @Test
    void givenMultiplePlayers_whenJoinSession_thenAllPlayersCanBeRetrieved() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findByGameCode(session.getGameCode()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.joinSession(session.getGameCode(), UUID.randomUUID(), "Player1");
        SessionDTO dto = service.joinSession(session.getGameCode(), UUID.randomUUID(), "Player2");

        assertThat(dto.players()).hasSize(3);
        assertThat(dto.players().stream().map(p -> p.playerName()).toList())
                .contains("Host", "Player1", "Player2");
    }

    @Test
    void givenValidInput_whenCreateSession_thenGameCodeIsGenerated() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        assertThat(dto.gameCode()).isNotNull();
        assertThat(dto.gameCode()).hasSize(6);
    }

    @Test
    void givenValidInput_whenCreateSession_thenSessionIdIsGenerated() {
        UUID hostId = UUID.randomUUID();
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        assertThat(dto.id()).isNotNull();
    }

    @Test
    void givenTickRateAt60_whenChangeTickRate_thenTickRateIsUpdated() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));
        when(gameSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionDTO dto = service.changeTickRate(session.getId(), hostId, 60);

        assertThat(dto.tickRateSeconds()).isEqualTo(60);
    }

    @Test
    void givenTickRateTooHigh_whenChangeTickRate_thenThrowsInvalidTickRateException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.changeTickRate(session.getId(), hostId, 61))
                .isInstanceOf(InvalidTickRateException.class);
    }

    @Test
    void givenTickRateNegative_whenChangeTickRate_thenThrowsInvalidTickRateException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = buildSavedSession(hostId, 4);
        when(gameSessionRepository.findById(session.getId()))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.changeTickRate(session.getId(), hostId, -5))
                .isInstanceOf(InvalidTickRateException.class);
    }
}
