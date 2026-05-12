package at.fhv.backend.domain.model.player;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface SessionPlayerRepository {
    Optional<ISessionPlayer> findByUserIdAndSessionId(UUID userId, UUID sessionId);
    ISessionPlayer save(ISessionPlayer player);
    List<ISessionPlayer> findAllBySessionId(UUID sessionId);
}

