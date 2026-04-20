package at.fhv.backend.domain.model.cargo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionCargoRepository {
    SessionCargo save(SessionCargo sessionCargo);
    Optional<SessionCargo> findById(UUID id);
    List<SessionCargo> findAvailableBySessionId(UUID sessionId, int currentTick);
    List<SessionCargo> findAvailableBySessionIdAndPort(UUID sessionId, UUID portId, int currentTick);
    List<SessionCargo> findAllBySessionId(UUID sessionId);
    List<SessionCargo> findAllBySessionIdAndPort(UUID sessionId, UUID portId);
    Optional<SessionCargo> findByIdForUpdate(UUID id);
    List<SessionCargo> findByAssignedPlayerId(UUID playerId);
    boolean existsBySessionId(UUID sessionId);
}
