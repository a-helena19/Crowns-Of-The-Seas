package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.rest.ShipMarketWebSocketController;
import at.fhv.backend.rest.dtos.ship.request.BuyShipDTO;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.application.services.ship.PurchaseShipService;
import at.fhv.backend.application.services.ship.ValidateShipService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.HomePortNotAssignedException;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.UsedShipListingRepository;
import at.fhv.backend.domain.model.ship.UsedShipListingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PurchaseShipServiceImpl implements PurchaseShipService {
    private final ValidateShipService validateShipService;
    private final ShipRepository shipRepository;
    private final PlayerShipRepository playerShipRepository;
    private final PlayerShipResponseMapper playerShipResponseMapper;
    private final ShipResponseMapper shipResponseMapper;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;
    private final ShipMarketWebSocketController shipMarketWebSocketController;
    private final UsedShipListingRepository usedShipListingRepository;

    public PurchaseShipServiceImpl(ValidateShipService validateShipService,
                                   ShipRepository shipRepository,
                                   PlayerShipRepository playerShipRepository,
                                   PlayerShipResponseMapper playerShipResponseMapper,
                                   ShipResponseMapper shipResponseMapper,
                                   SessionPlayerRepository sessionPlayerRepository,
                                   GameTickScheduler gameTickScheduler,
                                   ShipMarketWebSocketController shipMarketWebSocketController,
                                   UsedShipListingRepository usedShipListingRepository) {
        this.validateShipService = validateShipService;
        this.shipRepository = shipRepository;
        this.playerShipRepository = playerShipRepository;
        this.playerShipResponseMapper = playerShipResponseMapper;
        this.shipResponseMapper = shipResponseMapper;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.gameTickScheduler = gameTickScheduler;
        this.shipMarketWebSocketController = shipMarketWebSocketController;
        this.usedShipListingRepository = usedShipListingRepository;
    }

    @Override
    @Transactional
    public PlayerShipDTO buyShip(UUID playerId, UUID sessionId, BuyShipDTO request) {
        Ship ship = shipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", request.getShipId()));

        long owned = playerShipRepository.countByShipIdAndSessionId(ship.getId(), sessionId);
        long usedListings = usedShipListingRepository.countByShipIdAndSessionIdAndStatus(
                ship.getId(),
                sessionId,
                UsedShipListingStatus.AVAILABLE
        );
        if (owned + usedListings >= ship.getStock()) {
            throw new at.fhv.backend.domain.model.exception.ShipNotAvailableException(
                    "Schiff ist in dieser Session ausverkauft (Stock " + ship.getStock() + " erreicht).",
                    "shipId",
                    ship.getId()
            );
        }

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));
        BigDecimal playerBalance = player.getBalance();
        BigDecimal price = validateShipService.validatePurchase(ship, playerBalance);
        player.subtractBalance(price);
        sessionPlayerRepository.save(player);

        UUID homePortId = player.getHomePortId();
        if (homePortId == null) {
            throw new HomePortNotAssignedException(playerId);
        }

        PlayerShip playerShip = PlayerShip.createFromPurchase(ship.getId(), playerId, sessionId, homePortId);
        playerShip.completeRegistration();
        PlayerShip saved = playerShipRepository.save(playerShip);
        gameTickScheduler.triggerImmediateBroadcast(sessionId);
        shipMarketWebSocketController.broadcastStockUpdate(sessionId);
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
