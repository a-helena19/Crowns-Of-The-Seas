package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.infrastructure.mapper.ShipMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class ShipRepositoryImpl implements ShipRepository {
    private final ShipJpaRepository shipJpaRepository;
    private final ShipMapper shipMapper;

    public ShipRepositoryImpl(ShipJpaRepository shipJpaRepository, ShipMapper shipMapper) {
        this.shipJpaRepository = shipJpaRepository;
        this.shipMapper = shipMapper;
    }

    @Override
    public Ship save(Ship ship) {
        return shipMapper.toDomainModel(
                shipJpaRepository.save(shipMapper.toJpaEntity(ship))
        );
    }

    @Override
    public Optional<Ship> findById(UUID id) {
        return shipJpaRepository.findById(id)
                .map(shipMapper::toDomainModel);
    }

    @Override
    public List<Ship> findAllAvailableOnMarket() {
        return shipJpaRepository.findAllAvailableOnMarket()
                .stream()
                .map(shipMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<Ship> findAll() {
        return shipJpaRepository.findAll().stream()
                .map(shipMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        shipJpaRepository.deleteById(id);
    }
}
