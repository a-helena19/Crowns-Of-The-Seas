package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.services.impl.ship.ShipValuationServiceImpl;
import at.fhv.backend.application.services.impl.ship.UsedShipMarketServiceImpl;
import at.fhv.backend.application.services.ship.ShipValuationService;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.UsedShipListing;
import at.fhv.backend.domain.model.ship.UsedShipListingRepository;
import at.fhv.backend.domain.model.ship.UsedShipListingStatus;
import at.fhv.backend.rest.ShipMarketWebSocketController;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipQuoteDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsedShipMarketServiceImplTest {
    @Mock private PlayerShipRepository playerShipRepository;
    @Mock private ShipRepository shipRepository;
    @Mock private UsedShipListingRepository usedShipListingRepository;
    @Mock private SessionPlayerRepository sessionPlayerRepository;
    @Mock private PlayerShipResponseMapper playerShipResponseMapper;
    @Mock private at.fhv.backend.application.services.impl.session.GameTickScheduler gameTickScheduler;
    @Mock private ShipMarketWebSocketController shipMarketWebSocketController;
    private ShipValuationService shipValuationService = new ShipValuationServiceImpl();

    private UsedShipMarketServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UsedShipMarketServiceImpl(
                playerShipRepository,
                shipRepository,
                usedShipListingRepository,
                sessionPlayerRepository,
                shipValuationService,
                playerShipResponseMapper,
                gameTickScheduler,
                shipMarketWebSocketController
        );
    }

    private Ship buildShip(BigDecimal price) {
        return Ship.create("Test Ship", "desc", ShipClass.STANDARD, price, 100, 10.0, 2.0,
                BigDecimal.valueOf(400), BigDecimal.valueOf(100), 0.85, "icon.png", 20);
    }

    private PlayerShip buildPlayerShip(UUID playerId, UUID sessionId, UUID shipId, UUID portId) {
        PlayerShip playerShip = PlayerShip.createFromPurchase(shipId, playerId, sessionId, portId);
        playerShip.completeRegistration();
        return playerShip;
    }

    private ISessionPlayer buildPlayer(UUID playerId, UUID sessionId, BigDecimal balance) {
        return BaseSessionPlayer.reconstruct(
                UUID.randomUUID(), playerId, sessionId, "TestPlayer", false, balance, null, null);
    }

    private void stubQuote(PlayerShip playerShip, Ship ship, UUID playerId, UUID sessionId) {
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
    }

    @Test
    void givenFullFuelAndCondition_whenGetSellQuote_thenReturnsSeventyPercentOfOriginalPrice() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        stubQuote(playerShip, ship, playerId, sessionId);

        SellShipQuoteDTO quote = service.getSellQuote(playerShip.getId(), playerId, sessionId);

        assertThat(quote.getFinalPrice()).isEqualByComparingTo("700.00");
    }

    @Test
    void givenEmptyTank_whenGetSellQuote_thenTankWeightReducesPrice() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.consumeFuel(100);
        stubQuote(playerShip, ship, playerId, sessionId);

        SellShipQuoteDTO quote = service.getSellQuote(playerShip.getId(), playerId, sessionId);

        assertThat(quote.getFinalPrice()).isEqualByComparingTo("560.00");
    }

    @Test
    void givenDamagedCondition_whenGetSellQuote_thenConditionWeightReducesPrice() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.applyWear(50);
        stubQuote(playerShip, ship, playerId, sessionId);

        SellShipQuoteDTO quote = service.getSellQuote(playerShip.getId(), playerId, sessionId);

        assertThat(quote.getFinalPrice()).isEqualByComparingTo("420.00");
    }

    @Test
    void givenMixedFuelAndCondition_whenGetSellQuote_thenReturnsWeightedPrice() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.consumeFuel(40);
        playerShip.applyWear(20);
        stubQuote(playerShip, ship, playerId, sessionId);

        SellShipQuoteDTO quote = service.getSellQuote(playerShip.getId(), playerId, sessionId);

        assertThat(quote.getFinalPrice()).isEqualByComparingTo("532.00");
    }

    @Test
    void givenSellableShip_whenSellShip_thenCreditsPlayerCreatesListingAndDeletesOwnedShip() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(100));
        stubQuote(playerShip, ship, playerId, sessionId);
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        when(usedShipListingRepository.save(any(UsedShipListing.class))).thenAnswer(inv -> inv.getArgument(0));

        service.sellShip(playerShip.getId(), playerId, sessionId);

        assertThat(player.getBalance()).isEqualByComparingTo("800.00");
        verify(usedShipListingRepository).save(any(UsedShipListing.class));
        verify(playerShipRepository).deleteById(playerShip.getId());
    }

    @Test
    void givenShipNotAtPort_whenSellShip_thenThrowsInvalidStatusTransition() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.startLoading(UUID.randomUUID(), 10);
        stubQuote(playerShip, ship, playerId, sessionId);

        assertThatThrownBy(() -> service.sellShip(playerShip.getId(), playerId, sessionId))
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    @Test
    void givenShipEnRoute_whenSellShip_thenThrowsInvalidStatusTransition() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.departForVoyage(UUID.randomUUID());
        stubQuote(playerShip, ship, playerId, sessionId);

        assertThatThrownBy(() -> service.sellShip(playerShip.getId(), playerId, sessionId))
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    @Test
    void givenShipUnloading_whenSellShip_thenThrowsInvalidStatusTransition() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId(), UUID.randomUUID());
        playerShip.departForVoyage(UUID.randomUUID());
        playerShip.arriveAndStartUnloading(UUID.randomUUID(), 10);
        stubQuote(playerShip, ship, playerId, sessionId);

        assertThatThrownBy(() -> service.sellShip(playerShip.getId(), playerId, sessionId))
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    @Test
    void givenAvailableUsedListing_whenBuyUsedShip_thenBuyerPaysReceivesShipAndListingIsSold() {
        UUID buyerId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        UsedShipListing listing = UsedShipListing.create(ship.getId(), sessionId, sellerId, BigDecimal.valueOf(500), 40, 60, portId);
        ISessionPlayer buyer = buildPlayer(buyerId, sessionId, BigDecimal.valueOf(1000));

        when(usedShipListingRepository.findByIdAndSessionId(listing.getId(), sessionId)).thenReturn(Optional.of(listing));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(buyerId, sessionId)).thenReturn(Optional.of(buyer));
        when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(usedShipListingRepository.save(any(UsedShipListing.class))).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipResponseMapper.toResponse(any(PlayerShip.class), eq(ship))).thenReturn(new PlayerShipDTO());

        service.buyUsedShip(listing.getId(), buyerId, sessionId);

        assertThat(buyer.getBalance()).isEqualByComparingTo("500");
        assertThat(listing.getStatus()).isEqualTo(UsedShipListingStatus.SOLD);
        verify(playerShipRepository).save(argThat(playerShip ->
                playerShip.getFuel() == 40
                        && playerShip.getCondition() == 60
                        && playerShip.getCurrentPortId().equals(portId)
        ));
    }

    @Test
    void givenAvailableUsedListings_whenGetAvailableUsedShips_thenReturnsDtosWithFuelAndCondition() {
        UUID sessionId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        UsedShipListing listing = UsedShipListing.create(ship.getId(), sessionId, sellerId, BigDecimal.valueOf(500), 40, 60, UUID.randomUUID());
        when(usedShipListingRepository.findAllBySessionIdAndStatus(sessionId, UsedShipListingStatus.AVAILABLE))
                .thenReturn(List.of(listing));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));

        var result = service.getAvailableUsedShips(sessionId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFuel()).isEqualTo(40);
        assertThat(result.get(0).getCondition()).isEqualTo(60);
        assertThat(result.get(0).getPrice()).isEqualByComparingTo("500");
    }
}
