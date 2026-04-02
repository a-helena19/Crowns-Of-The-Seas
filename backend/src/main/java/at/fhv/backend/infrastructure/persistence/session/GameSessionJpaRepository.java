package at.fhv.backend.infrastructure.persistence.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GameSessionJpaRepository extends JpaRepository<GameSessionEntity, UUID> {
    Optional<GameSessionEntity> findByGameCode(String gameCode);
}