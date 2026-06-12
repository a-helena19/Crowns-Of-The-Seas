package at.fhv.backend.rest.dtos.chat.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageDTO(
        UUID id,
        UUID sessionId,
        UUID senderUserId,
        String senderPlayerName,
        String messageText,
        LocalDateTime sentAt
) {
}
