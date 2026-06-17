package at.fhv.backend.application.services.chat;

import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;

import java.util.List;
import java.util.UUID;

public interface SessionChatService {
    List<ChatMessageDTO> getMessages(UUID sessionId, UUID userId);
    ChatMessageDTO postMessage(UUID sessionId, UUID userId, String messageText);
    void deleteMessagesForSession(UUID sessionId);
}
