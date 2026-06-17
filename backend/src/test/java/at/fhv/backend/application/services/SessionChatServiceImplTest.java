package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.chat.SessionChatServiceImpl;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import at.fhv.backend.infrastructure.persistence.chat.SessionChatMessageEntity;
import at.fhv.backend.infrastructure.persistence.chat.SessionChatMessageJpaRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionChatServiceImplTest {

    @Mock
    private GameSessionRepository gameSessionRepository;

    @Mock
    private SessionChatMessageJpaRepository chatMessageRepository;

    @Mock
    private GameSessionWebSocketController webSocketController;

    private SessionChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SessionChatServiceImpl(gameSessionRepository, chatMessageRepository, webSocketController);
    }

    @Test
    void givenRunningSessionMember_whenPostMessage_thenMessageIsSavedAndBroadcast() {
        UUID hostId = UUID.randomUUID();
        GameSession session = runningSessionWithHost(hostId);
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(chatMessageRepository.save(any(SessionChatMessageEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChatMessageDTO message = service.postMessage(session.getId(), hostId, " Ahoy ");

        assertThat(message.messageText()).isEqualTo("Ahoy");
        assertThat(message.senderPlayerName()).isEqualTo("Host");
        verify(webSocketController).broadcastChatMessage(eq(session.getId().toString()), any(ChatMessageDTO.class));

        ArgumentCaptor<SessionChatMessageEntity> captor = ArgumentCaptor.forClass(SessionChatMessageEntity.class);
        verify(chatMessageRepository).save(captor.capture());
        assertThat(captor.getValue().getSessionId()).isEqualTo(session.getId());
    }

    @Test
    void givenBlankMessage_whenPostMessage_thenThrowsIllegalArgumentException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = runningSessionWithHost(hostId);
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.postMessage(session.getId(), hostId, "   "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void givenNonMember_whenGetMessages_thenThrowsPlayerNotFoundException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = runningSessionWithHost(hostId);
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.getMessages(session.getId(), UUID.randomUUID()))
                .isInstanceOf(PlayerNotFoundException.class);
    }

    @Test
    void givenNonRunningSession_whenGetMessages_thenThrowsSessionNotRunningException() {
        UUID hostId = UUID.randomUUID();
        GameSession session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.getMessages(session.getId(), hostId))
                .isInstanceOf(SessionNotRunningException.class);
    }

    @Test
    void givenStoredMessages_whenGetMessages_thenReturnsAscendingSessionMessages() {
        UUID hostId = UUID.randomUUID();
        GameSession session = runningSessionWithHost(hostId);
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        SessionChatMessageEntity message = new SessionChatMessageEntity();
        message.setId(UUID.randomUUID());
        message.setSessionId(session.getId());
        message.setSenderUserId(hostId);
        message.setSenderPlayerName("Host");
        message.setMessageText("Hello");
        message.setSentAt(java.time.LocalDateTime.now());
        when(chatMessageRepository.findAllBySessionIdOrderBySentAtAsc(session.getId())).thenReturn(List.of(message));

        List<ChatMessageDTO> messages = service.getMessages(session.getId(), hostId);

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).messageText()).isEqualTo("Hello");
    }

    private GameSession runningSessionWithHost(UUID hostId) {
        GameSession session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        session.addPlayer(new BaseSessionPlayer(hostId, session.getId(), "Host", true));
        session.beginFactionSelection(hostId);
        session.start(hostId);
        return session;
    }
}
