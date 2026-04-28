package at.fhv.backend.infrastructure.persistence.travel;

import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.infrastructure.mapper.TravelMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional
public class TravelRepositoryImpl implements TravelRepository {
    private final TravelJpaRepository travelJpaRepository;
    private final TravelMapper travelMapper;

    public TravelRepositoryImpl(TravelJpaRepository travelJpaRepository, TravelMapper travelMapper) {
        this.travelJpaRepository = travelJpaRepository;
        this.travelMapper = travelMapper;
    }

    @Override
    public Travel save(Travel travel) {
        return travelMapper.toDomainModel(
                travelJpaRepository.save(travelMapper.toJpaEntity(travel))
        );
    }

    @Override
    public Optional<Travel> findById(UUID travelId) {
        return travelJpaRepository.findById(travelId)
                .map(travelMapper::toDomainModel);
    }

    @Override
    public List<Travel> findAllByPlayerIdAndStatus(UUID playerId, TravelStatus status) {
        return travelJpaRepository.findAllByPlayerIdAndTravelStatus(playerId, status)
                .stream()
                .map(travelMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<Travel> findAllInProgress() {
        return travelJpaRepository.findAllByTravelStatus(TravelStatus.IN_PROGRESS)
                .stream()
                .map(travelMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Travel> findActiveByPlayerShipId(UUID playerShipId) {
        return travelJpaRepository.findActiveByPlayerShipId(playerShipId)
                .map(travelMapper::toDomainModel);
    }

    @Override
    public List<Travel> findAllInProgressBySessionId(UUID sessionId) {
        return travelJpaRepository.findAllInProgressBySessionId(sessionId)
                .stream()
                .map(travelMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<Travel> findByStatus(TravelStatus travelStatus) {
        return travelJpaRepository.findByTravelStatus(travelStatus)
                .stream()
                .map(travelMapper::toDomainModel)
                .collect(Collectors.toList());
    }
}
