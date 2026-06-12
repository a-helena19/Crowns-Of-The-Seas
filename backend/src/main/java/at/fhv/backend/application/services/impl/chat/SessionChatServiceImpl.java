package at.fhv.backend.application.services.impl.chat;

import at.fhv.backend.application.services.chat.SessionChatService;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.SessionStatus;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import at.fhv.backend.infrastructure.persistence.chat.SessionChatMessageEntity;
import at.fhv.backend.infrastructure.persistence.chat.SessionChatMessageJpaRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SessionChatServiceImpl implements SessionChatService {

    private final GameSessionRepository gameSessionRepository;
    private final SessionChatMessageJpaRepository chatMessageRepository;
    private final GameSessionWebSocketController webSocketController;

    public SessionChatServiceImpl(GameSessionRepository gameSessionRepository,
                                  SessionChatMessageJpaRepository chatMessageRepository,
                                  GameSessionWebSocketController webSocketController) {
        this.gameSessionRepository = gameSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.webSocketController = webSocketController;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getMessages(UUID sessionId, UUID userId) {
        GameSession session = loadAuthorizedRunningSession(sessionId, userId);
        return chatMessageRepository.findAllBySessionIdOrderBySentAtAsc(session.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageDTO postMessage(UUID sessionId, UUID userId, String messageText) {
        GameSession session = loadAuthorizedRunningSession(sessionId, userId);
        String trimmedMessage = messageText == null ? "" : messageText.trim();
        if (trimmedMessage.isEmpty()) {
            throw new IllegalArgumentException("Message text must not be blank");
        }

        ISessionPlayer sender = session.getPlayers().stream()
                .filter(player -> player.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(userId));

        SessionChatMessageEntity entity = new SessionChatMessageEntity();
        entity.setId(UUID.randomUUID());
        entity.setSessionId(sessionId);
        entity.setSenderUserId(userId);
        entity.setSenderPlayerName(sender.getPlayerName());
        entity.setMessageText(trimmedMessage);
        entity.setSentAt(LocalDateTime.now());

        ChatMessageDTO savedMessage = toDto(chatMessageRepository.save(entity));
        webSocketController.broadcastChatMessage(sessionId.toString(), savedMessage);
        return savedMessage;
    }

    @Override
    @Transactional
    public void deleteMessagesForSession(UUID sessionId) {
        chatMessageRepository.deleteAllBySessionId(sessionId);
    }

    private GameSession loadAuthorizedRunningSession(UUID sessionId, UUID userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        if (session.getStatus() != SessionStatus.RUNNING) {
            throw new SessionNotRunningException(sessionId);
        }

        if (!session.isPlayerInSession(userId) || session.isPlayerDisconnected(userId)) {
            throw new PlayerNotFoundException(userId);
        }

        return session;
    }

    private ChatMessageDTO toDto(SessionChatMessageEntity entity) {
        return new ChatMessageDTO(
                entity.getId(),
                entity.getSessionId(),
                entity.getSenderUserId(),
                entity.getSenderPlayerName(),
                entity.getMessageText(),
                entity.getSentAt()
        );
    }
}
