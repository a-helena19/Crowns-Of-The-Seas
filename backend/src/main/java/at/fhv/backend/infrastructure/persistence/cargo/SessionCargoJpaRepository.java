package at.fhv.backend.infrastructure.persistence.cargo;


import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionCargoJpaRepository extends JpaRepository<SessionCargoEntity, UUID> {
    @Query("SELECT s FROM SessionCargoEntity s WHERE s.sessionId = :sessionId AND s.cargoStatus = 'AVAILABLE' AND s.spawnTick <= :currentTick")
    List<SessionCargoEntity> findAvailableBySessionId(@Param("sessionId") UUID sessionId, @Param("currentTick") int currentTick);

    @Query("SELECT s FROM SessionCargoEntity s WHERE s.sessionId = :sessionId AND s.originPortId = :portId AND s.cargoStatus = 'AVAILABLE' AND s.spawnTick <= :currentTick")
    List<SessionCargoEntity> findAvailableBySessionIdAndPort(@Param("sessionId") UUID sessionId, @Param("portId") UUID portId, @Param("currentTick") int currentTick);

    @Query("SELECT s FROM SessionCargoEntity s WHERE s.sessionId = :sessionId AND s.originPortId = :portId")
    List<SessionCargoEntity> findAllBySessionIdAndPort(@Param("sessionId") UUID sessionId, @Param("portId") UUID portId);

    List<SessionCargoEntity> findAllBySessionId(UUID sessionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SessionCargoEntity s WHERE s.id = :id")
    Optional<SessionCargoEntity> findByIdForUpdate(@Param("id") UUID id);

    List<SessionCargoEntity> findByAssignedPlayerId(UUID assignedPlayerId);

    boolean existsBySessionId(UUID sessionId);
}
