package at.fhv.backend.infrastructure.persistence.player;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.infrastructure.mapper.SessionPlayerMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public class SessionPlayerRepositoryImpl implements SessionPlayerRepository {

    private final SessionPlayerJpaRepository jpaRepository;
    private final SessionPlayerMapper mapper;

    public SessionPlayerRepositoryImpl(SessionPlayerJpaRepository jpaRepository, SessionPlayerMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<ISessionPlayer> findByUserIdAndSessionId(UUID userId, UUID sessionId) {
        return jpaRepository.findByUserIdAndSessionId(userId, sessionId)
                .map(mapper::toDomain);
    }

    @Override
    public ISessionPlayer save(ISessionPlayer player) {
        SessionPlayerEntity entity = mapper.toEntity(player, null);
        SessionPlayerEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<ISessionPlayer> findAllBySessionId(UUID sessionId) {
        return jpaRepository.findAllBySessionId(sessionId)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }
}