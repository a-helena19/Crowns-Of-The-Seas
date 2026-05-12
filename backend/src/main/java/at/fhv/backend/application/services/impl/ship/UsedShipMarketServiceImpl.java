package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.ship.ShipValuationService;
import at.fhv.backend.application.services.ship.UsedShipMarketService;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.ShipNotAvailableException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.ship.*;
import at.fhv.backend.rest.ShipMarketWebSocketController;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipQuoteDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.UsedShipListingDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class UsedShipMarketServiceImpl implements UsedShipMarketService {
    private static final BigDecimal SELL_BASE_FACTOR = BigDecimal.valueOf(0.70);
    private static final BigDecimal CONDITION_WEIGHT = BigDecimal.valueOf(0.80);
    private static final BigDecimal FUEL_WEIGHT = BigDecimal.valueOf(0.20);

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final UsedShipListingRepository usedShipListingRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final ShipValuationService shipValuationService;
    private final PlayerShipResponseMapper playerShipResponseMapper;
    private final GameTickScheduler gameTickScheduler;
    private final ShipMarketWebSocketController shipMarketWebSocketController;

    public UsedShipMarketServiceImpl(PlayerShipRepository playerShipRepository,
                                     ShipRepository shipRepository,
                                     UsedShipListingRepository usedShipListingRepository,
                                     SessionPlayerRepository sessionPlayerRepository,
                                     ShipValuationService shipValuationService,
                                     PlayerShipResponseMapper playerShipResponseMapper,
                                     GameTickScheduler gameTickScheduler,
                                     ShipMarketWebSocketController shipMarketWebSocketController) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.usedShipListingRepository = usedShipListingRepository;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.shipValuationService = shipValuationService;
        this.playerShipResponseMapper = playerShipResponseMapper;
        this.gameTickScheduler = gameTickScheduler;
        this.shipMarketWebSocketController = shipMarketWebSocketController;
    }

    @Override
    @Transactional(readOnly = true)
    public SellShipQuoteDTO getSellQuote(UUID playerShipId, UUID playerId, UUID sessionId) {
        PlayerShip playerShip = findOwnedPlayerShip(playerShipId, playerId, sessionId);
        Ship ship = findShip(playerShip.getShipId());
        ensureSellable(playerShip);
        return toSellQuote(playerShip, ship);
    }

    @Override
    @Transactional
    public SellShipResponseDTO sellShip(UUID playerShipId, UUID playerId, UUID sessionId) {
        PlayerShip playerShip = findOwnedPlayerShip(playerShipId, playerId, sessionId);
        Ship ship = findShip(playerShip.getShipId());
        ensureSellable(playerShip);

        BigDecimal price = shipValuationService.calculateCurrentShipValue(ship, playerShip);
        UsedShipListing listing = UsedShipListing.create(
                playerShip.getShipId(),
                sessionId,
                playerId,
                price,
                playerShip.getFuel(),
                playerShip.getCondition(),
                playerShip.getCurrentPortId()
        );
        UsedShipListing savedListing = usedShipListingRepository.save(listing);

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));
        player.addBalance(price);
        sessionPlayerRepository.save(player);
        playerShipRepository.deleteById(playerShipId);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);
        shipMarketWebSocketController.broadcastStockUpdate(sessionId);
        return new SellShipResponseDTO(savedListing.getId(), playerShipId, price, player.getBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsedShipListingDTO> getAvailableUsedShips(UUID sessionId) {
        return usedShipListingRepository
                .findAllBySessionIdAndStatus(sessionId, UsedShipListingStatus.AVAILABLE)
                .stream()
                .map(this::toUsedShipListingDto)
                .toList();
    }

    @Override
    @Transactional
    public PlayerShipDTO buyUsedShip(UUID listingId, UUID playerId, UUID sessionId) {
        UsedShipListing listing = usedShipListingRepository.findByIdAndSessionId(listingId, sessionId)
                .orElseThrow(() -> new ShipNotAvailableException("Gebrauchtes Schiff ist nicht verfuegbar.", "listingId", listingId));
        if (listing.getStatus() != UsedShipListingStatus.AVAILABLE) {
            throw new ShipNotAvailableException("Gebrauchtes Schiff ist bereits verkauft.", "listingId", listingId);
        }

        Ship ship = findShip(listing.getShipId());
        ISessionPlayer buyer = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));
        buyer.subtractBalance(listing.getPrice());
        sessionPlayerRepository.save(buyer);

        PlayerShip playerShip = PlayerShip.createFromUsedListing(
                listing.getShipId(),
                playerId,
                sessionId,
                listing.getCurrentPortId(),
                listing.getCondition(),
                listing.getFuel()
        );
        PlayerShip savedPlayerShip = playerShipRepository.save(playerShip);
        listing.markSold();
        usedShipListingRepository.save(listing);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);
        shipMarketWebSocketController.broadcastStockUpdate(sessionId);
        return playerShipResponseMapper.toResponse(savedPlayerShip, ship);
    }

    private PlayerShip findOwnedPlayerShip(UUID playerShipId, UUID playerId, UUID sessionId) {
        return playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("playerShipId", playerShipId));
    }

    private Ship findShip(UUID shipId) {
        return shipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("shipId", shipId));
    }

    private void ensureSellable(PlayerShip playerShip) {
        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Nur Schiffe im Hafen koennen verkauft werden.", "playerShipId", playerShip.getId());
        }
        if (playerShip.getCurrentPortId() == null) {
            throw new InvalidShipStatusTransition("Schiff braucht einen aktuellen Hafen fuer den Verkauf.", "playerShipId", playerShip.getId());
        }
    }

    private SellShipQuoteDTO toSellQuote(PlayerShip playerShip, Ship ship) {
        SellShipQuoteDTO dto = new SellShipQuoteDTO();
        dto.setPlayerShipId(playerShip.getId());
        dto.setShipName(ship.getName());
        dto.setOriginalPrice(ship.getPrice());
        dto.setBaseSellPrice(ship.getPrice().multiply(SELL_BASE_FACTOR).setScale(2, RoundingMode.HALF_UP));
        dto.setCondition(playerShip.getCondition());
        dto.setFuel(playerShip.getFuel());
        dto.setConditionWeight(CONDITION_WEIGHT.doubleValue());
        dto.setFuelWeight(FUEL_WEIGHT.doubleValue());
        dto.setFinalPrice(shipValuationService.calculateCurrentShipValue(ship, playerShip));
        return dto;
    }

    private UsedShipListingDTO toUsedShipListingDto(UsedShipListing listing) {
        Ship ship = findShip(listing.getShipId());
        UsedShipListingDTO dto = new UsedShipListingDTO();
        dto.setId(listing.getId());
        dto.setShipId(listing.getShipId());
        dto.setSellerPlayerId(listing.getSellerPlayerId());
        dto.setCurrentPortId(listing.getCurrentPortId());
        dto.setName(ship.getName());
        dto.setDescription(ship.getDescription());
        dto.setShipClass(ship.getShipClass());
        dto.setPrice(listing.getPrice());
        dto.setFuel(listing.getFuel());
        dto.setCondition(listing.getCondition());
        dto.setMaxCargoCapacity(ship.getMaxCargoCapacity());
        dto.setMaxSpeed(ship.getMaxSpeed());
        dto.setFuelConsumption(ship.getFuelConsumption());
        dto.setMaxFuel(ship.getMaxFuel());
        dto.setOperatingCost(ship.getOperatingCost());
        dto.setBaseReliability(ship.getBaseReliability());
        dto.setIconUrl(ship.getIconUrl());
        return dto;
    }
}
