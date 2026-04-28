package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.ShipDTO;
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

    public List<ShipDTO> getMarketShips(String shipClass, UUID sessionId) {
        List<Ship> ships = (shipClass == null)
                ? shipRepository.findAllAvailableOnMarket()
                : shipRepository.findAllAvailableOnMarket().stream()
                .filter(ship -> ship.getShipClass().name().equalsIgnoreCase(shipClass))
                .toList();

        return ships.stream()
                .map(ship -> toMarketDto(ship, sessionId))
                .toList();
    }

    private ShipDTO toMarketDto(Ship ship, UUID sessionId) {
        ShipDTO dto = shipResponseMapper.toResponse(ship);
        if (sessionId != null) {
            long owned = playerShipRepository.countByShipIdAndSessionId(ship.getId(), sessionId);
            int available = (int) Math.max(0, ship.getStock() - owned);
            dto.setAvailableStock(available);
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlayerShipDTO> getPlayerShips(UUID playerId, UUID sessionId) {
        return playerShipRepository
                .findAllByPlayerIdAndSessionId(playerId, sessionId)
                .stream()
                .map(this::toPlayerShipResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerShipDTO getPlayerShip(UUID playerShipId, UUID playerId, UUID sessionId) {

        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("playerShipId", playerShipId));

        return toPlayerShipResponse(playerShip);
    }

    private PlayerShipDTO toPlayerShipResponse(PlayerShip playerShip) {
        Ship ship = shipRepository.findById(playerShip.getShipId()).orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));
        return playerShipResponseMapper.toResponse(playerShip, ship);
    }
}