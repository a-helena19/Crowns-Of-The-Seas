package at.fhv.backend.domain.model.player;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionPlayerRepositoryTest {

    @Mock
    private SessionPlayerRepository sessionPlayerRepository;

    @BeforeEach
    void setUp() {
        // Mocks are initialized by MockitoExtension
    }

    // Helper method: create a base session player
    private ISessionPlayer createTestPlayer(UUID userId, UUID sessionId, String name, boolean isHost) {
        return new BaseSessionPlayer(userId, sessionId, name, isHost);
    }

    // findByUserIdAndSessionId
    @Test
    void givenValidUserIdAndSessionId_whenFindPlayer_thenPlayerIsReturned() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player = createTestPlayer(userId, sessionId, "TestPlayer", false);

        when(sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId))
                .thenReturn(Optional.of(player));

        Optional<ISessionPlayer> result = sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId);

        assertThat(result).isPresent();
        assertThat(result.get().getPlayerName()).isEqualTo("TestPlayer");
        assertThat(result.get().getUserId()).isEqualTo(userId);
        assertThat(result.get().getSessionId()).isEqualTo(sessionId);
    }

    @Test
    void givenInvalidUserIdAndSessionId_whenFindPlayer_thenEmptyOptionalIsReturned() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        when(sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId))
                .thenReturn(Optional.empty());

        Optional<ISessionPlayer> result = sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId);

        assertThat(result).isEmpty();
    }

    @Test
    void givenDifferentSessions_whenFindPlayer_thenCorrectPlayerIsReturned() {
        UUID userId = UUID.randomUUID();
        UUID sessionId1 = UUID.randomUUID();
        UUID sessionId2 = UUID.randomUUID();
        ISessionPlayer player1 = createTestPlayer(userId, sessionId1, "Player1", false);
        ISessionPlayer player2 = createTestPlayer(userId, sessionId2, "Player2", true);

        when(sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId1))
                .thenReturn(Optional.of(player1));
        when(sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId2))
                .thenReturn(Optional.of(player2));

        Optional<ISessionPlayer> result1 = sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId1);
        Optional<ISessionPlayer> result2 = sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId2);

        assertThat(result1.get().getSessionId()).isEqualTo(sessionId1);
        assertThat(result2.get().getSessionId()).isEqualTo(sessionId2);
        assertThat(result1.get().getPlayerName()).isEqualTo("Player1");
        assertThat(result2.get().getPlayerName()).isEqualTo("Player2");
    }

    // save
    @Test
    void givenValidPlayer_whenSave_thenPlayerIsSaved() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player = createTestPlayer(userId, sessionId, "NewPlayer", false);

        when(sessionPlayerRepository.save(any(ISessionPlayer.class)))
                .thenReturn(player);

        ISessionPlayer savedPlayer = sessionPlayerRepository.save(player);

        assertThat(savedPlayer).isNotNull();
        assertThat(savedPlayer.getPlayerName()).isEqualTo("NewPlayer");
        verify(sessionPlayerRepository, times(1)).save(any(ISessionPlayer.class));
    }

    @Test
    void givenMultiplePlayers_whenSaveEach_thenAllPlayersAreSaved() {
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player1 = createTestPlayer(UUID.randomUUID(), sessionId, "Player1", false);
        ISessionPlayer player2 = createTestPlayer(UUID.randomUUID(), sessionId, "Player2", false);
        ISessionPlayer player3 = createTestPlayer(UUID.randomUUID(), sessionId, "Player3", true);

        when(sessionPlayerRepository.save(player1)).thenReturn(player1);
        when(sessionPlayerRepository.save(player2)).thenReturn(player2);
        when(sessionPlayerRepository.save(player3)).thenReturn(player3);

        sessionPlayerRepository.save(player1);
        sessionPlayerRepository.save(player2);
        sessionPlayerRepository.save(player3);

        verify(sessionPlayerRepository, times(3)).save(any(ISessionPlayer.class));
    }

    @Test
    void givenHostPlayer_whenSave_thenPlayerRetainsHostStatus() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer hostPlayer = createTestPlayer(userId, sessionId, "Host", true);

        when(sessionPlayerRepository.save(hostPlayer)).thenReturn(hostPlayer);

        ISessionPlayer savedPlayer = sessionPlayerRepository.save(hostPlayer);

        assertThat(savedPlayer.isHost()).isTrue();
    }

    @Test
    void givenNonHostPlayer_whenSave_thenPlayerRetainsNonHostStatus() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer nonHostPlayer = createTestPlayer(userId, sessionId, "Player", false);

        when(sessionPlayerRepository.save(nonHostPlayer)).thenReturn(nonHostPlayer);

        ISessionPlayer savedPlayer = sessionPlayerRepository.save(nonHostPlayer);

        assertThat(savedPlayer.isHost()).isFalse();
    }

    @Test
    void givenPlayerWithInitialBalance_whenSave_thenPlayerBalanceIsPreserved() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player = createTestPlayer(userId, sessionId, "Player", false);

        when(sessionPlayerRepository.save(player)).thenReturn(player);

        ISessionPlayer savedPlayer = sessionPlayerRepository.save(player);

        assertThat(savedPlayer.getBalance()).isNotNull();
    }

    @Test
    void givenValidPlayer_whenFindAndUpdate_thenUpdatedPlayerIsRetrieved() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player = createTestPlayer(userId, sessionId, "OriginalName", false);

        when(sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId))
                .thenReturn(Optional.of(player));
        when(sessionPlayerRepository.save(any(ISessionPlayer.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Optional<ISessionPlayer> foundPlayer = sessionPlayerRepository.findByUserIdAndSessionId(userId, sessionId);
        assertThat(foundPlayer).isPresent();

        // Simulate an update
        ISessionPlayer updatedPlayer = foundPlayer.get();
        sessionPlayerRepository.save(updatedPlayer);

        verify(sessionPlayerRepository, times(1)).findByUserIdAndSessionId(userId, sessionId);
        verify(sessionPlayerRepository, times(1)).save(any(ISessionPlayer.class));
    }
}

