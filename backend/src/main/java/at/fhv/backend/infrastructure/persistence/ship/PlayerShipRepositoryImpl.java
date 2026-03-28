package at.fhv.backend.infrastructure.persistence.ship;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.infrastructure.mapper.PlayerShipMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class PlayerShipRepositoryImpl implements PlayerShipRepository {
    private final PlayerShipJpaRepository playerShipJpaRepository;
    private final PlayerShipMapper playerShipMapper;

    public PlayerShipRepositoryImpl(PlayerShipJpaRepository playerShipJpaRepository, PlayerShipMapper playerShipMapper) {
        this.playerShipJpaRepository = playerShipJpaRepository;
        this.playerShipMapper = playerShipMapper;
    }

    @Override
    public PlayerShip save(PlayerShip playerShip) {
        return playerShipMapper.toDomainModel(
                playerShipJpaRepository.save(playerShipMapper.toJpaEntity(playerShip))
        );
    }

    @Override
    public Optional<PlayerShip> findById(UUID id) {
        return playerShipJpaRepository.findById(id)
                .map(playerShipMapper::toDomainModel);
    }

    @Override
    public List<PlayerShip> findAllByPlayerId(UUID playerId) {
        return playerShipJpaRepository.findAllByPlayerId(playerId)
                .stream()
                .map(playerShipMapper::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<PlayerShip> findAllByPlayerIdAndStatus(UUID playerId, ShipStatus status) {
        return playerShipJpaRepository.findAllByPlayerIdAndStatus(playerId, status)
                .stream()
                .map(playerShipMapper::toDomainModel)
                .collect(Collectors.toList());
    }
}
