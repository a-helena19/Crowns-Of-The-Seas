package at.fhv.backend.infrastructure.persistence.player;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SessionPlayerJpaRepository extends JpaRepository<SessionPlayerEntity, UUID> {
    Optional<SessionPlayerEntity> findByUserIdAndSessionId(UUID userId, UUID sessionId);
}
