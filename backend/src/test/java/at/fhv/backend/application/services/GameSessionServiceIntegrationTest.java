package at.fhv.backend.application.services;

import at.fhv.backend.config.TestDatasourceConfig;
import at.fhv.backend.domain.model.session.exception.*;
import at.fhv.backend.domain.model.session.exception.OnlyHostCanStartException;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Import(TestDatasourceConfig.class)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
@Transactional
class GameSessionServiceIntegrationTest {

    @Autowired
    private GameSessionService gameSessionService;

    //  createSession

    @Test
    void givenValidInput_whenCreateSession_thenSessionIsPersisted() {
        UUID hostId = UUID.randomUUID();

        SessionDTO dto = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        assertThat(dto.id()).isNotNull();
        assertThat(dto.status()).isEqualTo("LOBBY");
        assertThat(dto.maxPlayers()).isEqualTo(4);
        assertThat(dto.tickRateSeconds()).isEqualTo(5);
        assertThat(dto.players()).hasSize(1);
        assertThat(dto.players().get(0).isHost()).isTrue();
    }

    @Test
    void givenValidInput_whenCreateSession_thenGameCodeIsNotBlank() {
        UUID hostId = UUID.randomUUID();

        SessionDTO dto = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        assertThat(dto.gameCode()).isNotBlank();
        assertThat(dto.gameCode()).hasSize(6);
    }

    //  joinSession

    @Test
    void givenExistingLobby_whenJoin_thenPlayerCountIncreases() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        SessionDTO joined = gameSessionService.joinSession(created.gameCode(), UUID.randomUUID(), "Alice");

        assertThat(joined.players()).hasSize(2);
    }

    @Test
    void givenMultipleJoins_whenFull_thenThrowsSessionFullException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 2, 5, Duration.ofMinutes(30));

        gameSessionService.joinSession(created.gameCode(), UUID.randomUUID(), "Alice");

        assertThatThrownBy(() ->
                gameSessionService.joinSession(created.gameCode(), UUID.randomUUID(), "Bob"))
                .isInstanceOf(SessionFullException.class);
    }

    @Test
    void givenUnknownGameCode_whenJoin_thenThrowsSessionNotFoundException() {
        assertThatThrownBy(() ->
                gameSessionService.joinSession("ZZZZZZ", UUID.randomUUID(), "Nobody"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    //  startGame

    @Test
    void givenLobbyWithHost_whenHostStartsGame_thenStatusChangesToRunning() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        SessionDTO started = gameSessionService.startGame(created.id(), hostId);

        assertThat(started.status()).isEqualTo("RUNNING");
    }

    @Test
    void givenLobbyWithHost_whenNonHostStartsGame_thenThrowsOnlyHostCanStartException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        assertThatThrownBy(() ->
                gameSessionService.startGame(created.id(), UUID.randomUUID()))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenAlreadyRunningSession_whenStartGame_thenThrowsSessionNotInLobbyException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));
        gameSessionService.startGame(created.id(), hostId);

        assertThatThrownBy(() ->
                gameSessionService.startGame(created.id(), hostId))
                .isInstanceOf(SessionNotInLobbyException.class);
    }

    //  changeTickRate

    @Test
    void givenLobbySession_whenHostChangesTickRate_thenTickRateIsPersisted() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        SessionDTO updated = gameSessionService.changeTickRate(created.id(), hostId, 30);

        assertThat(updated.tickRateSeconds()).isEqualTo(30);
    }

    @Test
    void givenLobbySession_whenNonHostChangesTickRate_thenThrowsOnlyHostCanStartException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        assertThatThrownBy(() ->
                gameSessionService.changeTickRate(created.id(), UUID.randomUUID(), 10))
                .isInstanceOf(OnlyHostCanStartException.class);
    }

    @Test
    void givenLobbySession_whenInvalidTickRate_thenThrowsInvalidTickRateException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO created = gameSessionService.createSession(hostId, "Host", 4, 5, Duration.ofMinutes(30));

        assertThatThrownBy(() ->
                gameSessionService.changeTickRate(created.id(), hostId, 99))
                .isInstanceOf(InvalidTickRateException.class);
    }

    //  Vollständiger Flow

    @Test
    void givenFullFlow_whenCreateJoinAndStart_thenSessionRunsCorrectly() {
        UUID hostId = UUID.randomUUID();
        UUID player2Id = UUID.randomUUID();

        // 1. Host erstellt Session
        SessionDTO created = gameSessionService.createSession(hostId, "Captain", 4, 5, Duration.ofMinutes(60));
        assertThat(created.status()).isEqualTo("LOBBY");

        // 2. Spieler tritt bei
        SessionDTO joined = gameSessionService.joinSession(created.gameCode(), player2Id, "Sailor");
        assertThat(joined.players()).hasSize(2);

        // 3. Host ändert Tick-Rate
        SessionDTO tickUpdated = gameSessionService.changeTickRate(created.id(), hostId, 10);
        assertThat(tickUpdated.tickRateSeconds()).isEqualTo(10);

        // 4. Host startet das Spiel
        SessionDTO started = gameSessionService.startGame(created.id(), hostId);
        assertThat(started.status()).isEqualTo("RUNNING");

        // 5. Nach dem Start kann niemand mehr beitreten
        assertThatThrownBy(() ->
                gameSessionService.joinSession(created.gameCode(), UUID.randomUUID(), "Late"))
                .isInstanceOf(SessionNotInLobbyException.class);
    }
}
