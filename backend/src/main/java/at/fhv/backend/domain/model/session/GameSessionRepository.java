package at.fhv.backend.domain.model.session;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameSessionRepository {
    GameSession save(GameSession session);
    Optional<GameSession> findById(UUID id);
    Optional<GameSession> findByGameCode(String gameCode);
    List<GameSession> findAll();
    List<GameSession> findActiveSessionsByUserId(UUID userId);
}
