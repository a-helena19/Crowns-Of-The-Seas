package at.fhv.backend.domain.model.session;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class GameSessionTest {

    private UUID hostId;
    private GameSession session;

    @BeforeEach
    void setUp() {
        hostId = UUID.randomUUID();
        session = new GameSession(hostId, 4, 5, Duration.ofMinutes(30));
    }

    //  Konstruktor / Initialzustand

    @Test
    void givenNewSession_thenStatusIsLobby() {
        assertThat(session.getStatus()).isEqualTo(SessionStatus.LOBBY);
    }

    @Test
    void givenNewSession_thenCurrentTickIsZero() {
        assertThat(session.getCurrentTick()).isEqualTo(0);
    }

    @Test
    void givenNewSession_thenGameCodeIsNotBlank() {
        assertThat(session.getGameCode()).isNotBlank();
    }

    @Test
    void givenNewSession_thenGameCodeIsUpperCase6Chars() {
        String code = session.getGameCode();
        assertThat(code).hasSize(6);
        assertThat(code).isEqualTo(code.toUpperCase());
    }

    @Test
    void givenNewSession_thenPlayerListIsEmpty() {
        assertThat(session.getPlayers()).isEmpty();
    }

    @Test
    void givenNewSession_thenStartTimeIsNull() {
        assertThat(session.getStartTime()).isNull();
    }

    //  addPlayer

    @Test
    void givenLobbySession_whenAddPlayer_thenPlayerIsAdded() {
        ISessionPlayer player = new BaseSessionPlayer(hostId, session.getId(), "Host", true);
        session.addPlayer(player);
        assertThat(session.getPlayers()).hasSize(1);
    }

    @Test
    void givenFullSession_whenAddPlayer_thenThrowsSessionFullException() {
        // maxPlayers = 4, already fill it
        for (int i = 0; i < 4; i++) {
            session.addPlayer(new BaseSessionPlayer(UUID.randomUUID(), session.getId(), "P" + i, i == 0));
        }
        ISessionPlayer extra = new BaseSessionPlayer(UUID.randomUUID(), session.getId(), "Extra", false);
        assertThatThrownBy(() -> session.addPlayer(extra))
                .isInstanceOf(SessionFullException.class);
    }

    @Test
    void givenRunningSession_whenAddPlayer_thenThrowsSessionNotInLobbyException() {
        ISessionPlayer host = new BaseSessionPlayer(hostId, session.getId(), "Host", true);
        session.addPlayer(host);
        session.start(hostId);

        ISessionPlayer late = new BaseSessionPlayer(UUID.randomUUID(), session.getId(), "Late", false);
        assertThatThrownBy(() -> session.addPlayer(late))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    @Test
    void givenLobbySession_thenPlayersListIsUnmodifiable() {
        assertThatThrownBy(() -> session.getPlayers().add(
                new BaseSessionPlayer(UUID.randomUUID(), session.getId(), "X", false)))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    //  start

    @Test
    void givenLobbySession_whenHostStarts_thenStatusIsRunning() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        assertThat(session.getStatus()).isEqualTo(SessionStatus.RUNNING);
    }

    @Test
    void givenLobbySession_whenHostStarts_thenStartTimeIsSet() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        assertThat(session.getStartTime()).isNotNull();
    }

    @Test
    void givenLobbySession_whenNonHostStarts_thenThrowsOnlyHostCanStartException() {
        UUID nonHost = UUID.randomUUID();
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        assertThatThrownBy(() -> session.start(nonHost))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenRunningSession_whenStartAgain_thenThrowsSessionNotInLobbyException() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        assertThatThrownBy(() -> session.start(hostId))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    //  changeTickRate

    @Test
    void givenLobbySession_whenHostChangesTickRate_thenTickRateIsUpdated() {
        session.changeTickRate(hostId, 10);
        assertThat(session.getTickRateSeconds()).isEqualTo(10);
    }

    @Test
    void givenLobbySession_whenNonHostChangesTickRate_thenThrowsOnlyHostCanStartException() {
        UUID nonHost = UUID.randomUUID();
        assertThatThrownBy(() -> session.changeTickRate(nonHost, 10))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenLobbySession_whenTickRateIsZero_thenThrowsInvalidTickRateException() {
        assertThatThrownBy(() -> session.changeTickRate(hostId, 0))
                .isInstanceOf(InvalidTickRateException.class);
    }

    @Test
    void givenLobbySession_whenTickRateIs61_thenThrowsInvalidTickRateException() {
        assertThatThrownBy(() -> session.changeTickRate(hostId, 61))
                .isInstanceOf(InvalidTickRateException.class);
    }

    @Test
    void givenLobbySession_whenTickRateIs1_thenAccepted() {
        session.changeTickRate(hostId, 1);
        assertThat(session.getTickRateSeconds()).isEqualTo(1);
    }

    @Test
    void givenLobbySession_whenTickRateIs60_thenAccepted() {
        session.changeTickRate(hostId, 60);
        assertThat(session.getTickRateSeconds()).isEqualTo(60);
    }

    @Test
    void givenRunningSession_whenChangeTickRate_thenThrowsSessionNotInLobbyException() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        assertThatThrownBy(() -> session.changeTickRate(hostId, 10))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    //  tick

    @Test
    void givenRunningSession_whenTick_thenCurrentTickIncremented() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        session.tick();
        assertThat(session.getCurrentTick()).isEqualTo(1);
    }

    @Test
    void givenLobbySession_whenTick_thenCurrentTickRemainsZero() {
        session.tick();
        assertThat(session.getCurrentTick()).isEqualTo(0);
    }

    @Test
    void givenRunningSession_whenTickMultipleTimes_thenCountsCorrectly() {
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.start(hostId);
        for (int i = 0; i < 5; i++) session.tick();
        assertThat(session.getCurrentTick()).isEqualTo(5);
    }

    //  reconstruct

    @Test
    void givenReconstructedSession_thenFieldsMatch() {
        UUID id = UUID.randomUUID();
        GameSession reconstructed = GameSession.reconstruct(
                id, SessionStatus.RUNNING, hostId, 6,
                3, 10, "ABC123",
                java.util.List.of(), java.util.Map.of(),
                java.time.LocalDateTime.now(), Duration.ofHours(1));

        assertThat(reconstructed.getId()).isEqualTo(id);
        assertThat(reconstructed.getStatus()).isEqualTo(SessionStatus.RUNNING);
        assertThat(reconstructed.getMaxPlayers()).isEqualTo(6);
        assertThat(reconstructed.getCurrentTick()).isEqualTo(3);
        assertThat(reconstructed.getGameCode()).isEqualTo("ABC123");
    }

    //  SessionStatus transitions

    @Test
    void givenLobbyStatus_thenCanTransitionToRunning() {
        assertThat(SessionStatus.LOBBY.canTransitionTo(SessionStatus.RUNNING)).isTrue();
    }

    @Test
    void givenLobbyStatus_thenCannotTransitionToFinished() {
        assertThat(SessionStatus.LOBBY.canTransitionTo(SessionStatus.FINISHED)).isFalse();
    }

    @Test
    void givenRunningStatus_thenCanTransitionToFinished() {
        assertThat(SessionStatus.RUNNING.canTransitionTo(SessionStatus.FINISHED)).isTrue();
    }

    @Test
    void givenRunningStatus_thenCannotTransitionToLobby() {
        assertThat(SessionStatus.RUNNING.canTransitionTo(SessionStatus.LOBBY)).isFalse();
    }

    @Test
    void givenFinishedStatus_thenCannotTransitionToAnything() {
        assertThat(SessionStatus.FINISHED.canTransitionTo(SessionStatus.LOBBY)).isFalse();
        assertThat(SessionStatus.FINISHED.canTransitionTo(SessionStatus.RUNNING)).isFalse();
    }
}

