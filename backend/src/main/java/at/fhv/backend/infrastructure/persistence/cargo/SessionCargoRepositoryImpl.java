package at.fhv.backend.infrastructure.persistence.cargo;


import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.infrastructure.mapper.SessionCargoMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


@Repository
@Transactional
public class SessionCargoRepositoryImpl implements SessionCargoRepository {
    private final SessionCargoJpaRepository sessionCargoJpaRepository;
    private final SessionCargoMapper sessionCargoMapper;

    public SessionCargoRepositoryImpl(SessionCargoJpaRepository sessionCargoJpaRepository, SessionCargoMapper sessionCargoMapper) {
        this.sessionCargoJpaRepository = sessionCargoJpaRepository;
        this.sessionCargoMapper = sessionCargoMapper;
    }

    @Override
    public SessionCargo save(SessionCargo sc) {
        return sessionCargoMapper.toDomainModel(sessionCargoJpaRepository.save(sessionCargoMapper.toJpaEntity(sc)));
    }

    @Override
    public Optional<SessionCargo> findById(UUID id) {
        return sessionCargoJpaRepository.findById(id).map(sessionCargoMapper::toDomainModel);
    }

    @Override
    public List<SessionCargo> findAvailableBySessionId(UUID sessionId, int currentTick) {
        return sessionCargoJpaRepository.findAvailableBySessionId(sessionId, currentTick)
                .stream().map(sessionCargoMapper::toDomainModel).collect(Collectors.toList());
    }

    @Override
    public List<SessionCargo> findAllBySessionId(UUID sessionId) {
        return sessionCargoJpaRepository.findAllBySessionId(sessionId)
                .stream().map(sessionCargoMapper::toDomainModel).collect(Collectors.toList());
    }

    @Override
    public Optional<SessionCargo> findByIdForUpdate(UUID id) {
        return sessionCargoJpaRepository.findByIdForUpdate(id).map(sessionCargoMapper::toDomainModel);
    }

    @Override
    public List<SessionCargo> findByAssignedPlayerId(UUID playerId) {
        return sessionCargoJpaRepository.findByAssignedPlayerId(playerId)
                .stream().map(sessionCargoMapper::toDomainModel).collect(Collectors.toList());
    }

    @Override
    public boolean existsBySessionId(UUID sessionId) {
        return sessionCargoJpaRepository.existsBySessionId(sessionId);
    }
}