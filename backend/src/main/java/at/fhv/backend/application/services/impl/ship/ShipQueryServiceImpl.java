package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.dtos.response.ShipDTO;
import at.fhv.backend.application.services.ship.ShipQueryService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShipQueryServiceImpl implements ShipQueryService {
    private final ShipRepository shipRepository;
    private final ShipResponseMapper shipResponseMapper;
    private final PlayerShipRepository playerShipRepository;
    private final PlayerShipResponseMapper playerShipResponseMapper;

    public ShipQueryServiceImpl(ShipRepository shipRepository, ShipResponseMapper shipResponseMapper, PlayerShipRepository playerShipRepository, PlayerShipResponseMapper playerShipResponseMapper) {
        this.shipRepository = shipRepository;
        this.shipResponseMapper = shipResponseMapper;
        this.playerShipRepository = playerShipRepository;
        this.playerShipResponseMapper = playerShipResponseMapper;
    }

    public List<ShipDTO> getMarketShips(String shipClass) {
        if (shipClass == null) {
            return shipRepository.findAllAvailableOnMarket()
                    .stream()
                    .map(shipResponseMapper::toResponse)
                    .toList();
        }

        return shipRepository.findAllAvailableOnMarket().stream()
                .filter(ship -> ship.getShipClass().name().equalsIgnoreCase(shipClass))
                .map(shipResponseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerShipDTO> getPlayerShips(UUID playerId) {
        return playerShipRepository.findAllByPlayerId(playerId)
                .stream()
                .map(ps -> toPlayerShipResponse(ps))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerShipDTO getPlayerShip(UUID playerShipId, UUID playerId) {
        PlayerShip playerShip = findPlayerShipOrThrow(playerShipId);
        if (!playerShip.isOwnedBy(playerId)) {
            throw new ShipNotFoundException("playerId", playerId);
        }
        return toPlayerShipResponse(playerShip);
    }

    private PlayerShip findPlayerShipOrThrow(UUID playerShipId) {
        return playerShipRepository.findById(playerShipId)
                .orElseThrow(() -> new ShipNotFoundException("playerShipId", playerShipId));

    }

    private PlayerShipDTO toPlayerShipResponse(PlayerShip playerShip) {
        Ship ship = shipRepository.findById(playerShip.getShipId()).orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));
        return playerShipResponseMapper.toResponse(playerShip, ship);
    }
}
