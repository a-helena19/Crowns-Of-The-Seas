package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.dtos.request.BuyShipDTO;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.services.impl.ship.PurchaseShipServiceImpl;
import at.fhv.backend.application.services.impl.travel.PortInfoHelper;
import at.fhv.backend.application.services.ship.ValidateShipService;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseShipServiceImplTest {
    @Mock
    private ValidateShipService validateShipService;
    @Mock
    private ShipRepository shipRepository;
    @Mock
    private PlayerShipRepository playerShipRepository;
    @Mock
    private PlayerShipResponseMapper playerShipResponseMapper;
    @Mock
    private ShipResponseMapper shipResponseMapper;
    @Mock
    private PortInfoHelper portInfoHelper;
    @Mock
    private SessionPlayerRepository sessionPlayerRepository;

    private PurchaseShipServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PurchaseShipServiceImpl(
                validateShipService, shipRepository, playerShipRepository,
                playerShipResponseMapper, shipResponseMapper, portInfoHelper, sessionPlayerRepository
        );
    }

    private Ship buildShip(BigDecimal price) {
        return Ship.create("Black Pearl", "A fast ship", ShipClass.STANDARD,
                price, 100, 15.0, 2.5, BigDecimal.valueOf(500), BigDecimal.valueOf(200), 0.9, "icon.png");
    }

    private ISessionPlayer buildPlayer(UUID userId, UUID sessionId, BigDecimal balance) {
        return BaseSessionPlayer.reconstruct(UUID.randomUUID(), userId, sessionId, "TestPlayer", false, balance);
    }

    private BuyShipDTO buildBuyShipDTO(UUID shipId) {
        BuyShipDTO dto = new BuyShipDTO();
        dto.setShipId(shipId);
        return dto;
    }

    @Test
    void givenValidPurchase_whenBuyShip_thenPlayerShipRepositorySaveIsCalled() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(5000));
        UUID startPortId = UUID.randomUUID();

        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        when(validateShipService.validatePurchase(ship, player.getBalance())).thenReturn(ship.getPrice());
        when(sessionPlayerRepository.save(player)).thenReturn(player);
        when(portInfoHelper.getDefaultStartPortId()).thenReturn(startPortId);
        when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(playerShipResponseMapper.toResponse(any(PlayerShip.class), eq(ship))).thenReturn(new PlayerShipDTO());

        BuyShipDTO dto = buildBuyShipDTO(ship.getId());
        service.buyShip(playerId, sessionId, dto);
        verify(playerShipRepository, times(1)).save(any(PlayerShip.class));
    }

    @Test
    void givenValidPurchase_whenBuyShip_thenPlayerBalanceIsSubtracted() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(5000));

        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        when(validateShipService.validatePurchase(eq(ship), any())).thenReturn(ship.getPrice());
        when(sessionPlayerRepository.save(player)).thenReturn(player);
        when(portInfoHelper.getDefaultStartPortId()).thenReturn(UUID.randomUUID());
        when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipResponseMapper.toResponse(any(PlayerShip.class), eq(ship))).thenReturn(new PlayerShipDTO());

        service.buyShip(playerId, sessionId, buildBuyShipDTO(ship.getId()));
        assertThat(player.getBalance()).isEqualByComparingTo(BigDecimal.valueOf(4000));
    }

    @Test
    void givenUnknownShipId_whenBuyShip_thenThrowsShipNotFoundException() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID unknownShipId = UUID.randomUUID();

        when(shipRepository.findById(unknownShipId)).thenReturn(Optional.empty());

        BuyShipDTO dto = buildBuyShipDTO(unknownShipId);
        assertThatThrownBy(() -> service.buyShip(playerId, sessionId, dto)).isInstanceOf(ShipNotFoundException.class);
    }

    @Test
    void givenUnknownPlayer_whenBuyShip_thenThrowsPlayerNotFoundException() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));

        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buyShip(playerId, sessionId, buildBuyShipDTO(ship.getId()))).isInstanceOf(PlayerNotFoundException.class);
    }

    @Test
    void givenInsufficientFunds_whenBuyShip_thenThrowsInsufficientFundsException() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(99999));
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(100));

        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        when(validateShipService.validatePurchase(ship, player.getBalance())).thenThrow(new InsufficientFundsException(ship.getPrice(), player.getBalance()));

        assertThatThrownBy(() -> service.buyShip(playerId, sessionId, buildBuyShipDTO(ship.getId()))).isInstanceOf(InsufficientFundsException.class);
    }

    @Test
    void givenValidPurchase_whenBuyShip_thenCreatedPlayerShipHasStatusAtPort() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(BigDecimal.valueOf(1000));
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(5000));

        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        when(validateShipService.validatePurchase(any(), any())).thenReturn(ship.getPrice());
        when(sessionPlayerRepository.save(player)).thenReturn(player);
        when(portInfoHelper.getDefaultStartPortId()).thenReturn(UUID.randomUUID());

        when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> {
            PlayerShip ps = inv.getArgument(0);
            assertThat(ps.getStatus().name()).isEqualTo("AT_PORT");
            return ps;
        });
        when(playerShipResponseMapper.toResponse(any(), eq(ship))).thenReturn(new PlayerShipDTO());
        service.buyShip(playerId, sessionId, buildBuyShipDTO(ship.getId()));
    }

    @Test
    void givenExistingPlayer_whenGetBalance_thenReturnsCorrectBalance() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        ISessionPlayer player = buildPlayer(playerId, sessionId, BigDecimal.valueOf(12345));

        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(player));
        BigDecimal balance = service.getBalanceByPlayerId(playerId, sessionId);
        assertThat(balance).isEqualByComparingTo(BigDecimal.valueOf(12345));
    }

    @Test
    void givenUnknownPlayer_whenGetBalance_thenReturnsZero() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        BigDecimal balance = service.getBalanceByPlayerId(playerId, sessionId);
        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }
}