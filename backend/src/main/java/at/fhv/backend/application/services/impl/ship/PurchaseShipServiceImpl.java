package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.dtos.request.BuyShipDTO;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.dtos.response.ShipDTO;
import at.fhv.backend.application.services.impl.travel.PlayerHelper;
import at.fhv.backend.application.services.impl.travel.PortInfoHelper;
import at.fhv.backend.application.services.ship.PurchaseShipService;
import at.fhv.backend.application.services.ship.ValidateShipService;
import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.infrastructure.mapper.PlayerShipMapper;
import at.fhv.backend.infrastructure.mapper.ShipMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PurchaseShipServiceImpl implements PurchaseShipService {
    private final ValidateShipService validateShipService;
    private final ShipRepository shipRepository;
    private final PlayerShipRepository playerShipRepository;
    private final PlayerShipResponseMapper playerShipResponseMapper;
    private final ShipResponseMapper shipResponseMapper;
    private final PlayerHelper playerHelper;
    private final PortInfoHelper portInfoHelper;

    public PurchaseShipServiceImpl(ValidateShipService validateShipService, ShipRepository shipRepository, PlayerShipRepository playerShipRepository, PlayerShipResponseMapper playerShipResponseMapper,
                                   ShipResponseMapper shipResponseMapper, PlayerHelper playerHelper, PortInfoHelper portInfoHelper) {
        this.validateShipService = validateShipService;
        this.shipRepository = shipRepository;
        this.playerShipRepository = playerShipRepository;
        this.playerShipResponseMapper = playerShipResponseMapper;
        this.shipResponseMapper = shipResponseMapper;
        this.playerHelper = playerHelper;
        this.portInfoHelper = portInfoHelper;
    }

    @Override
    public PlayerShipDTO buyShip(UUID playerId, BuyShipDTO request) {
        Ship ship = shipRepository.findById(request.getShipId()).orElseThrow(() -> new ShipNotFoundException("shipId", request.getShipId()));
        BigDecimal playerBalance = playerHelper.getBalance(playerId);
        BigDecimal price = validateShipService.validatePurchase(ship, playerBalance);
        playerHelper.deductBalance(playerId, price);
        UUID startPortId = portInfoHelper.getDefaultStartPortId();
        PlayerShip playerShip = PlayerShip.createFromPurchase(ship.getId(), playerId, startPortId);
        PlayerShip saved = playerShipRepository.save(playerShip);
        return toPlayerShipResponse(saved);
    }

    private PlayerShipDTO toPlayerShipResponse(PlayerShip playerShip) {
        Ship ship = shipRepository.findById(playerShip.getShipId()).orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));
        return playerShipResponseMapper.toResponse(playerShip, ship);
    }

}
