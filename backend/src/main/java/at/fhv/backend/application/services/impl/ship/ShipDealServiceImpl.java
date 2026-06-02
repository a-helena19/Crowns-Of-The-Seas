package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.ship.ShipDealService;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.exception.ShipNotAvailableException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.HomePortNotAssignedException;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipDeal;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.ShipMarketWebSocketController;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.ShipDealDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ShipDealServiceImpl implements ShipDealService {

    private static final int MAX_ACTIVE_DEALS = 5;
    private static final int BASE_VISIBLE_DEALS = 3;

    private static final double MIN_DISCOUNT = 0.10;
    private static final double MAX_DISCOUNT = 0.25;

    private static final double MAX_EFFECTIVE_DISCOUNT = 0.40;

    private static final int MIN_QUANTITY = 1;
    private static final int MAX_QUANTITY = 2;
    private static final int MIN_DURATION_TICKS = 10;
    private static final int MAX_DURATION_TICKS = 15;

    private final ShipRepository shipRepository;
    private final PlayerShipRepository playerShipRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PlayerShipResponseMapper playerShipResponseMapper;
    private final ShipMarketWebSocketController shipMarketWebSocketController;
    private final GameTickScheduler gameTickScheduler;

    private final Map<UUID, List<ShipDeal>> dealsBySession = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public ShipDealServiceImpl(ShipRepository shipRepository,
                               PlayerShipRepository playerShipRepository,
                               SessionPlayerRepository sessionPlayerRepository,
                               GameSessionRepository gameSessionRepository,
                               PlayerShipResponseMapper playerShipResponseMapper,
                               ShipMarketWebSocketController shipMarketWebSocketController,
                               GameTickScheduler gameTickScheduler) {
        this.shipRepository = shipRepository;
        this.playerShipRepository = playerShipRepository;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.playerShipResponseMapper = playerShipResponseMapper;
        this.shipMarketWebSocketController = shipMarketWebSocketController;
        this.gameTickScheduler = gameTickScheduler;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipDealDTO> getDealsForPlayer(UUID playerId, UUID sessionId) {
        int currentTick = currentTick(sessionId);
        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        List<ShipDeal> activeDeals = refreshPool(sessionId, currentTick);
        activeDeals.sort((a, b) -> Integer.compare(a.getCreatedTick(), b.getCreatedTick()));

        int visibleCount = visibleDealCount(player, activeDeals.size());

        List<ShipDealDTO> result = new ArrayList<>();
        for (int i = 0; i < visibleCount; i++) {
            ShipDeal deal = activeDeals.get(i);
            Ship ship = shipRepository.findById(deal.getShipId()).orElse(null);
            if (ship == null) {
                continue;
            }
            result.add(toDto(deal, ship, player, currentTick));
        }
        return result;
    }

    @Override
    @Transactional
    public PlayerShipDTO buyDeal(UUID dealId, UUID playerId, UUID sessionId) {
        int currentTick = currentTick(sessionId);
        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        ShipDeal deal = findDeal(sessionId, dealId);
        if (deal == null || !deal.isAvailable(currentTick)) {
            throw new ShipNotAvailableException("Dieses Angebot ist nicht mehr verfuegbar.", "dealId", dealId);
        }

        Ship ship = shipRepository.findById(deal.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", deal.getShipId()));

        BigDecimal price = computeDealPrice(deal, ship, player);
        if (player.getBalance().compareTo(price) < 0) {
            throw new InsufficientFundsException(price, player.getBalance());
        }

        UUID homePortId = player.getHomePortId();
        if (homePortId == null) {
            throw new HomePortNotAssignedException(playerId);
        }

        // Erst die knappe Einheit reservieren — verhindert Doppelverkauf bei konkurrierenden Kaeufen.
        if (!deal.tryClaim(currentTick)) {
            throw new ShipNotAvailableException("Dieses Angebot wurde gerade weggeschnappt.", "dealId", dealId);
        }

        player.subtractBalance(price);
        sessionPlayerRepository.save(player);

        PlayerShip playerShip = PlayerShip.createFromPurchase(ship.getId(), playerId, sessionId, homePortId);
        playerShip.completeRegistration();
        PlayerShip saved = playerShipRepository.save(playerShip);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);
        shipMarketWebSocketController.broadcastStockUpdate(sessionId);

        System.out.println("[ShipDeal] Player " + playerId + " bought deal " + dealId
                + " (ship " + ship.getName() + ") for " + price + " T"
                + " — original " + ship.getPrice() + " T");

        return playerShipResponseMapper.toResponse(saved, ship);
    }

    private List<ShipDeal> refreshPool(UUID sessionId, int currentTick) {
        List<ShipDeal> pool = dealsBySession.computeIfAbsent(sessionId, key -> new ArrayList<>());
        synchronized (pool) {
            pool.removeIf(deal -> !deal.isAvailable(currentTick));

            if (pool.size() < MAX_ACTIVE_DEALS) {
                List<Ship> marketShips = shipRepository.findAllAvailableOnMarket();
                while (pool.size() < MAX_ACTIVE_DEALS && !marketShips.isEmpty()) {
                    Ship ship = marketShips.get(random.nextInt(marketShips.size()));
                    double discount = MIN_DISCOUNT + random.nextDouble() * (MAX_DISCOUNT - MIN_DISCOUNT);
                    int quantity = MIN_QUANTITY + random.nextInt(MAX_QUANTITY - MIN_QUANTITY + 1);
                    int duration = MIN_DURATION_TICKS + random.nextInt(MAX_DURATION_TICKS - MIN_DURATION_TICKS + 1);
                    pool.add(new ShipDeal(sessionId, ship.getId(), discount, quantity,
                            currentTick, currentTick + duration));
                }
            }
            return new ArrayList<>(pool);
        }
    }

    private ShipDeal findDeal(UUID sessionId, UUID dealId) {
        List<ShipDeal> pool = dealsBySession.get(sessionId);
        if (pool == null) {
            return null;
        }
        synchronized (pool) {
            for (ShipDeal deal : pool) {
                if (deal.getId().equals(dealId)) {
                    return deal;
                }
            }
        }
        return null;
    }

    private int visibleDealCount(ISessionPlayer player, int poolSize) {
        int count = (int) Math.round(BASE_VISIBLE_DEALS * player.getMarketOfferQuantityModifier());
        if (count < 0) {
            count = 0;
        }
        return Math.min(count, poolSize);
    }

    private BigDecimal computeDealPrice(ShipDeal deal, Ship ship, ISessionPlayer player) {
        double effectiveDiscount = effectiveDiscount(deal, player);
        return ship.getPrice()
                .multiply(BigDecimal.valueOf(1.0 - effectiveDiscount))
                .setScale(0, RoundingMode.HALF_UP);
    }

    private double effectiveDiscount(ShipDeal deal, ISessionPlayer player) {
        double discount = deal.getBaseDiscountPercent() * player.getMarketOfferModifier();
        return Math.min(MAX_EFFECTIVE_DISCOUNT, discount);
    }

    private ShipDealDTO toDto(ShipDeal deal, Ship ship, ISessionPlayer player, int currentTick) {
        ShipDealDTO dto = new ShipDealDTO();
        dto.setDealId(deal.getId());
        dto.setShipId(ship.getId());
        dto.setName(ship.getName());
        dto.setDescription(ship.getDescription());
        dto.setShipClass(ship.getShipClass());
        dto.setIconUrl(ship.getIconUrl());

        dto.setMaxCargoCapacity(ship.getMaxCargoCapacity());
        dto.setMaxSpeed(ship.getMaxSpeed());
        dto.setFuelConsumption(ship.getFuelConsumption());
        dto.setMaxFuel(ship.getMaxFuel());
        dto.setOperatingCost(ship.getOperatingCost());
        dto.setBaseReliability(ship.getBaseReliability());

        dto.setOriginalPrice(ship.getPrice());
        dto.setDealPrice(computeDealPrice(deal, ship, player));
        dto.setDiscountPercent((int) Math.round(effectiveDiscount(deal, player) * 100));
        dto.setRemainingQuantity(deal.getRemainingQuantity());
        dto.setExpiresInTicks(Math.max(0, deal.getExpiryTick() - currentTick));
        dto.setTraderBonus(player.getMarketOfferModifier() > 1.0
                || player.getMarketOfferQuantityModifier() > 1.0);
        return dto;
    }

    private int currentTick(UUID sessionId) {
        return gameSessionRepository.findById(sessionId)
                .map(session -> session.getCurrentTick())
                .orElse(0);
    }
}