package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.ship.request.BuyShipDTO;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.application.services.ship.PurchaseShipService;
import at.fhv.backend.application.services.ship.ValidateShipService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class PurchaseShipServiceImpl implements PurchaseShipService {
    private final ValidateShipService validateShipService;
    private final ShipRepository shipRepository;
    private final PlayerShipRepository playerShipRepository;
    private final PlayerShipResponseMapper playerShipResponseMapper;
    private final ShipResponseMapper shipResponseMapper;
    private final PortQueryService portQueryService;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;

    public PurchaseShipServiceImpl(ValidateShipService validateShipService,
                                   ShipRepository shipRepository,
                                   PlayerShipRepository playerShipRepository,
                                   PlayerShipResponseMapper playerShipResponseMapper,
                                   ShipResponseMapper shipResponseMapper,
                                   PortQueryService portQueryService,
                                   SessionPlayerRepository sessionPlayerRepository,
                                   GameTickScheduler gameTickScheduler) {
        this.validateShipService = validateShipService;
        this.shipRepository = shipRepository;
        this.playerShipRepository = playerShipRepository;
        this.playerShipResponseMapper = playerShipResponseMapper;
        this.shipResponseMapper = shipResponseMapper;
        this.portQueryService = portQueryService;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.gameTickScheduler = gameTickScheduler;
    }

    @Override
    public PlayerShipDTO buyShip(UUID playerId, UUID sessionId, BuyShipDTO request) {
        Ship ship = shipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", request.getShipId()));
        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));
        BigDecimal playerBalance = player.getBalance();
        BigDecimal price = validateShipService.validatePurchase(ship, playerBalance);
        player.subtractBalance(price);
        sessionPlayerRepository.save(player);

        List<PortResponseDTO> ports = portQueryService.findAll();
        if (ports.isEmpty()) {
            throw new IllegalStateException("No ports available in the system");
        }
        UUID startPortId = ports.get(0).id();

        PlayerShip playerShip = PlayerShip.createFromPurchase(ship.getId(), playerId, sessionId, startPortId);
        playerShip.completeRegistration();
        PlayerShip saved = playerShipRepository.save(playerShip);
        gameTickScheduler.triggerImmediateBroadcast(sessionId);
        return toPlayerShipResponse(saved);
    }

    @Override
    public BigDecimal getBalanceByPlayerId(UUID playerId, UUID sessionId) {
        return sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .map(ISessionPlayer::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    private PlayerShipDTO toPlayerShipResponse(PlayerShip playerShip) {
        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));
        return playerShipResponseMapper.toResponse(playerShip, ship);
    }
}
