package at.fhv.backend.application.services;


import at.fhv.backend.application.dtos.mapper.PlayerShipResponseMapper;
import at.fhv.backend.application.dtos.mapper.ShipResponseMapper;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.dtos.response.ShipDTO;
import at.fhv.backend.application.services.impl.ship.ShipQueryServiceImpl;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipQueryServiceImplTest {

    @Mock
    private ShipRepository shipRepository;
    @Mock
    private ShipResponseMapper shipResponseMapper;
    @Mock
    private PlayerShipRepository playerShipRepository;
    @Mock
    private PlayerShipResponseMapper playerShipResponseMapper;

    private ShipQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ShipQueryServiceImpl(shipRepository, shipResponseMapper, playerShipRepository, playerShipResponseMapper);
    }

    private Ship buildShip(ShipClass shipClass) {
        return Ship.create("Test Ship", "desc", shipClass,
                BigDecimal.valueOf(1000), 100, 10.0, 2.0,
                BigDecimal.valueOf(400), BigDecimal.valueOf(100), 0.85, "icon.png");
    }

    private PlayerShip buildPlayerShip(UUID playerId, UUID sessionId, UUID shipId) {
        PlayerShip ps = PlayerShip.createFromPurchase(shipId, playerId, sessionId, UUID.randomUUID());
        ps.completeRegistration();
        return ps;
    }

    @Test
    void givenNoFilter_whenGetMarketShips_thenReturnsAllShips() {
        Ship ship1 = buildShip(ShipClass.BUDGET);
        Ship ship2 = buildShip(ShipClass.PREMIUM);
        when(shipRepository.findAllAvailableOnMarket()).thenReturn(List.of(ship1, ship2));
        when(shipResponseMapper.toResponse(ship1)).thenReturn(new ShipDTO());
        when(shipResponseMapper.toResponse(ship2)).thenReturn(new ShipDTO());

        List<ShipDTO> result = service.getMarketShips(null);
        assertThat(result).hasSize(2);
    }

    @Test
    void givenClassFilter_whenGetMarketShips_thenReturnsOnlyMatchingClass() {
        Ship budget = buildShip(ShipClass.BUDGET);
        Ship premium = buildShip(ShipClass.PREMIUM);
        when(shipRepository.findAllAvailableOnMarket()).thenReturn(List.of(budget, premium));
        when(shipResponseMapper.toResponse(budget)).thenReturn(new ShipDTO());

        List<ShipDTO> result = service.getMarketShips("BUDGET");
        assertThat(result).hasSize(1);
        verify(shipResponseMapper, times(1)).toResponse(budget);
        verify(shipResponseMapper, never()).toResponse(premium);
    }

    @Test
    void givenNoShipsOnMarket_whenGetMarketShips_thenReturnsEmptyList() {
        when(shipRepository.findAllAvailableOnMarket()).thenReturn(List.of());
        List<ShipDTO> result = service.getMarketShips(null);
        assertThat(result).isEmpty();
    }

    @Test
    void givenCaseInsensitiveFilter_whenGetMarketShips_thenReturnsMatchingShips() {
        Ship standard = buildShip(ShipClass.STANDARD);
        when(shipRepository.findAllAvailableOnMarket()).thenReturn(List.of(standard));
        when(shipResponseMapper.toResponse(standard)).thenReturn(new ShipDTO());

        List<ShipDTO> result = service.getMarketShips("standard");
        assertThat(result).hasSize(1);
    }

    @Test
    void givenPlayerWithShips_whenGetPlayerShips_thenReturnsAllPlayerShips() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(ShipClass.STANDARD);
        PlayerShip ps = buildPlayerShip(playerId, sessionId, ship.getId());

        when(playerShipRepository.findAllByPlayerIdAndSessionId(playerId, sessionId)).thenReturn(List.of(ps));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(playerShipResponseMapper.toResponse(ps, ship)).thenReturn(new PlayerShipDTO());

        List<PlayerShipDTO> result = service.getPlayerShips(playerId, sessionId);
        assertThat(result).hasSize(1);
    }

    @Test
    void givenPlayerWithNoShips_whenGetPlayerShips_thenReturnsEmptyList() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        when(playerShipRepository.findAllByPlayerIdAndSessionId(playerId, sessionId)).thenReturn(List.of());
        List<PlayerShipDTO> result = service.getPlayerShips(playerId, sessionId);
        assertThat(result).isEmpty();
    }

    @Test
    void givenExistingPlayerShip_whenGetPlayerShip_thenReturnsMappedDTO() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = buildShip(ShipClass.BUDGET);
        PlayerShip ps = buildPlayerShip(playerId, sessionId, ship.getId());
        PlayerShipDTO expectedDto = new PlayerShipDTO();

        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(ps.getId(), playerId, sessionId)).thenReturn(Optional.of(ps));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        when(playerShipResponseMapper.toResponse(ps, ship)).thenReturn(expectedDto);

        PlayerShipDTO result = service.getPlayerShip(ps.getId(), playerId, sessionId);
        assertThat(result).isEqualTo(expectedDto);
    }

    @Test
    void givenUnknownPlayerShipId_whenGetPlayerShip_thenThrowsShipNotFoundException() {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID unknownId = UUID.randomUUID();

        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(unknownId, playerId, sessionId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPlayerShip(unknownId, playerId, sessionId)).isInstanceOf(ShipNotFoundException.class);
    }
}

