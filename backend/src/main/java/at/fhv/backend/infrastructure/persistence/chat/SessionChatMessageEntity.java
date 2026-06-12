package at.fhv.backend.infrastructure.persistence.chat;

import at.fhv.backend.infrastructure.persistence.session.GameSessionEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_chat_messages")
public class SessionChatMessageEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "sender_user_id", nullable = false)
    private UUID senderUserId;

    @Column(name = "sender_player_name", nullable = false)
    private String senderPlayerName;

    @Column(name = "message_text", nullable = false, length = 1000)
    private String messageText;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private GameSessionEntity session;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getSenderUserId() {
        return senderUserId;
    }

    public void setSenderUserId(UUID senderUserId) {
        this.senderUserId = senderUserId;
    }

    public String getSenderPlayerName() {
        return senderPlayerName;
    }

    public void setSenderPlayerName(String senderPlayerName) {
        this.senderPlayerName = senderPlayerName;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public GameSessionEntity getSession() {
        return session;
    }

    public void setSession(GameSessionEntity session) {
        this.session = session;
    }
}
