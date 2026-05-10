package at.fhv.backend.infrastructure.persistence.session;

import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.infrastructure.mapper.GameSessionMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class GameSessionRepositoryImpl implements GameSessionRepository {

    private final GameSessionJpaRepository jpaRepository;
    private final GameSessionMapper mapper;

    public GameSessionRepositoryImpl(GameSessionJpaRepository jpaRepository, GameSessionMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    @Override
    @Transactional
    public GameSession save(GameSession session) {
        GameSessionEntity entity = mapper.toEntity(session);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<GameSession> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<GameSession> findByGameCode(String gameCode) {
        return jpaRepository.findByGameCode(gameCode).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GameSession> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GameSession> findActiveSessionsByUserId(UUID userId) {
        return jpaRepository.findActiveSessionsByUserId(userId)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }


    @Override
    @Transactional
    public Optional<GameSession> findByIdWithLock(UUID id) {
        return jpaRepository.findByIdWithLock(id).map(mapper::toDomain);
    }


}
