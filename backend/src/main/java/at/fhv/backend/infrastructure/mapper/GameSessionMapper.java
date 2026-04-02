package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.infrastructure.persistence.session.GameSessionEntity;

public interface GameSessionMapper {
    GameSession toDomain(GameSessionEntity entity);
    GameSessionEntity toEntity(GameSession domain);
}
