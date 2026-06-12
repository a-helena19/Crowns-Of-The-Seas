package at.fhv.backend.application.services;

import at.fhv.backend.application.services.chat.SessionChatService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.config.TestDatasourceConfig;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestDatasourceConfig.class)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
@Transactional
class SessionChatServiceIntegrationTest {

    @Autowired
    private GameSessionService gameSessionService;

    @Autowired
    private SessionChatService sessionChatService;

    @Autowired
    private PortQueryService portQueryService;

    @Test
    void givenRunningSession_whenPostAndLoadMessages_thenHistoryIsPersistedPerSession() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createRunningSession(hostId, "Host");

        sessionChatService.postMessage(session.id(), hostId, "First message");
        sessionChatService.postMessage(session.id(), hostId, "Second message");

        List<ChatMessageDTO> messages = sessionChatService.getMessages(session.id(), hostId);

        assertThat(messages).hasSize(2);
        assertThat(messages).extracting(ChatMessageDTO::messageText)
                .containsExactly("First message", "Second message");
    }

    @Test
    void givenTwoSessions_whenLoadMessages_thenOnlyOwnSessionMessagesAreReturned() {
        UUID playerOne = UUID.randomUUID();
        UUID playerTwo = UUID.randomUUID();
        SessionDTO sessionOne = createRunningSession(playerOne, "Alpha");
        SessionDTO sessionTwo = createRunningSession(playerTwo, "Beta");

        sessionChatService.postMessage(sessionOne.id(), playerOne, "Only session one");
        sessionChatService.postMessage(sessionTwo.id(), playerTwo, "Only session two");

        List<ChatMessageDTO> sessionOneMessages = sessionChatService.getMessages(sessionOne.id(), playerOne);

        assertThat(sessionOneMessages).hasSize(1);
        assertThat(sessionOneMessages.get(0).messageText()).isEqualTo("Only session one");
    }

    @Test
    void givenLobbySession_whenLoadMessages_thenThrowsSessionNotRunningException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = gameSessionService.createSession(hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));

        assertThatThrownBy(() -> sessionChatService.getMessages(session.id(), hostId))
                .isInstanceOf(SessionNotRunningException.class);
    }

    private SessionDTO createRunningSession(UUID hostId, String hostName) {
        SessionDTO created = gameSessionService.createSession(hostId, hostName, 4, 5, 100, Duration.ofMinutes(30));
        gameSessionService.startGame(created.id(), hostId);
        gameSessionService.assignPlayerFaction(created.id(), hostId, "SMUGGLERS");
        UUID homePortId = portQueryService.findAll().get(0).id();
        gameSessionService.assignHomePort(created.id(), hostId, homePortId);
        gameSessionService.markPlayerReady(created.id(), hostId);
        return gameSessionService.getSession(created.id());
    }
}
