package at.fhv.backend.domain.model.session;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class GameSessionLeaveRejoinTest {

    private UUID hostId;
    private UUID guestId;
    private GameSession session;

    @BeforeEach
    void setUp() {
        hostId = UUID.randomUUID();
        guestId = UUID.randomUUID();
        session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.addPlayer(new BaseSessionPlayer(guestId, session.getId(), "Guest", false));
    }

    private void startRunning() {
        session.beginFactionSelection(hostId);
        session.start(hostId);
    }

    // ── leave ──

    @Test
    void givenRunningSession_whenPlayerLeaves_thenPlayerStaysInSession() {
        startRunning();

        session.leave(guestId);

        // Spieler bleibt erhalten (nur als getrennt markiert), nicht gelöscht.
        assertThat(session.isPlayerInSession(guestId)).isTrue();
        assertThat(session.getPlayers())
                .anyMatch(p -> p.getUserId().equals(guestId));
    }

    @Test
    void givenRunningSession_whenPlayerLeaves_thenPlayerIsMarkedDisconnected() {
        startRunning();

        session.leave(guestId);

        assertThat(session.isPlayerDisconnected(guestId)).isTrue();
        assertThat(session.isPlayerConnected(guestId)).isFalse();
    }

    @Test
    void givenRunningSession_whenPlayerLeaves_thenDataIsPreserved() {
        startRunning();
        ISessionPlayer guestBefore = session.getPlayers().stream()
                .filter(p -> p.getUserId().equals(guestId)).findFirst().orElseThrow();

        session.leave(guestId);

        ISessionPlayer guestAfter = session.getPlayers().stream()
                .filter(p -> p.getUserId().equals(guestId)).findFirst().orElseThrow();
        // Kontostand & Identität bleiben unverändert erhalten.
        assertThat(guestAfter.getBalance()).isEqualByComparingTo(guestBefore.getBalance());
        assertThat(guestAfter.getPlayerName()).isEqualTo("Guest");
    }

    @Test
    void givenRunningSession_whenLeave_thenConnectedCountDecreases() {
        startRunning();
        assertThat(session.getConnectedPlayerCount()).isEqualTo(2);

        session.leave(guestId);

        assertThat(session.getConnectedPlayerCount()).isEqualTo(1);
    }

    @Test
    void givenPlayerNotInSession_whenLeave_thenThrowsPlayerNotFoundException() {
        startRunning();
        UUID stranger = UUID.randomUUID();

        assertThatThrownBy(() -> session.leave(stranger))
                .isInstanceOf(PlayerNotFoundException.class);
    }

    @Test
    void givenAllPlayersLeave_thenConnectedCountIsZero() {
        startRunning();

        session.leave(guestId);
        session.leave(hostId);

        assertThat(session.getConnectedPlayerCount()).isEqualTo(0);
        // Spieler sind weiterhin in der Liste, nur getrennt.
        assertThat(session.getPlayers()).hasSize(2);
    }

    // ── rejoin ──

    @Test
    void givenDisconnectedPlayer_whenRejoin_thenPlayerIsConnectedAgain() {
        startRunning();
        session.leave(guestId);

        session.rejoin(guestId);

        assertThat(session.isPlayerDisconnected(guestId)).isFalse();
        assertThat(session.isPlayerConnected(guestId)).isTrue();
        assertThat(session.getConnectedPlayerCount()).isEqualTo(2);
    }

    @Test
    void givenNonRunningSession_whenRejoin_thenThrowsSessionNotRunningException() {
        // Session ist noch in LOBBY.
        assertThatThrownBy(() -> session.rejoin(guestId))
                .isInstanceOf(SessionNotRunningException.class);
    }

    @Test
    void givenStranger_whenRejoinRunningSession_thenThrowsPlayerNotFoundException() {
        startRunning();
        UUID stranger = UUID.randomUUID();

        // Fremde, die nie Teil der Session waren, können nicht beitreten.
        assertThatThrownBy(() -> session.rejoin(stranger))
                .isInstanceOf(PlayerNotFoundException.class);
    }

    @Test
    void givenConnectedPlayer_whenRejoin_thenRemainsConnected() {
        startRunning();

        // Rejoin ohne vorheriges Leave ist unkritisch und idempotent.
        session.rejoin(guestId);

        assertThat(session.isPlayerConnected(guestId)).isTrue();
    }

    // ── isPlayerConnected / isPlayerInSession Abgrenzung ──

    @Test
    void givenStranger_thenIsPlayerInSessionIsFalse() {
        assertThat(session.isPlayerInSession(UUID.randomUUID())).isFalse();
    }

    @Test
    void givenConnectedPlayer_thenIsPlayerConnectedIsTrue() {
        assertThat(session.isPlayerConnected(guestId)).isTrue();
    }
}