package at.fhv.backend.infrastructure.persistence.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SessionChatMessageJpaRepository extends JpaRepository<SessionChatMessageEntity, UUID> {
    List<SessionChatMessageEntity> findAllBySessionIdOrderBySentAtAsc(UUID sessionId);
    void deleteAllBySessionId(UUID sessionId);
}
