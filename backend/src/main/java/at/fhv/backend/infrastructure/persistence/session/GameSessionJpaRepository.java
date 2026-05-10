package at.fhv.backend.infrastructure.persistence.session;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameSessionJpaRepository extends JpaRepository<GameSessionEntity, UUID> {
    Optional<GameSessionEntity> findByGameCode(String gameCode);

    @Query("SELECT DISTINCT s FROM GameSessionEntity s JOIN s.players p WHERE p.userId = :userId AND s.status != 'FINISHED'")
    List<GameSessionEntity> findActiveSessionsByUserId(@Param("userId") UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM GameSessionEntity s WHERE s.id = :id")
    Optional<GameSessionEntity> findByIdWithLock(@Param("id") UUID id);
}