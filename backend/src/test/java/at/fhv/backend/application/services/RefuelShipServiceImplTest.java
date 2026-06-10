package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.impl.ship.RefuelShipServiceImpl;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.rest.dtos.ship.response.RefuelQuoteDTO;
import at.fhv.backend.rest.dtos.ship.response.RefuelResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefuelShipServiceImplTest {

    @Mock private PlayerShipRepository playerShipRepository;
    @Mock private ShipRepository shipRepository;
    @Mock private SessionPlayerRepository sessionPlayerRepository;
    @Mock private GameTickScheduler gameTickScheduler;
    @Mock private GameSessionRepository gameSessionRepository;

    private RefuelShipServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RefuelShipServiceImpl(
                playerShipRepository,
                shipRepository,
                sessionPlayerRepository,
                gameTickScheduler,
                gameSessionRepository
        );
    }

    @Test
    void quoteUsesTwelveTalersPerFuelUnitForPartialRefuel() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(10_000), 40.0);

        RefuelQuoteDTO quote = service.getRefuelQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 60.0
        );

        assertThat(quote.fuelAddedPercent()).isEqualTo(20.0);
        assertThat(quote.fuelAddedUnits()).isEqualTo(100.0);
        assertThat(quote.totalCost()).isEqualByComparingTo("1200");
    }

    @Test
    void quoteClampsTargetFuelToOneHundredPercent() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(10_000), 40.0);

        RefuelQuoteDTO quote = service.getRefuelQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 130.0
        );

        assertThat(quote.targetFuelPercent()).isEqualTo(100.0);
        assertThat(quote.fuelAddedPercent()).isEqualTo(60.0);
        assertThat(quote.totalCost()).isEqualByComparingTo("3600");
    }

    @Test
    void quoteAppliesPlayerFuelCostModifier() {
        TestData data = stubPlayerShipAndShip(40.0);
        ISessionPlayer player = mock(ISessionPlayer.class);
        when(player.getFuelCostModifier()).thenReturn(0.75);
        when(player.getBalance()).thenReturn(BigDecimal.valueOf(10_000));
        when(sessionPlayerRepository.findByUserIdAndSessionId(data.playerId(), data.sessionId()))
                .thenReturn(Optional.of(player));

        RefuelQuoteDTO quote = service.getRefuelQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 60.0
        );

        assertThat(quote.totalCost()).isEqualByComparingTo("900");
    }

    @Test
    void quoteAndRefuelChargeUseTheSameCalculation() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(10_000), 40.0);
        GameSession session = mock(GameSession.class);
        when(session.getCurrentTick()).thenReturn(10);
        when(gameSessionRepository.findById(data.sessionId())).thenReturn(Optional.of(session));

        RefuelQuoteDTO quote = service.getRefuelQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 60.0
        );
        RefuelResponseDTO response = service.refuel(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 60.0
        );

        assertThat(response.totalCost()).isEqualByComparingTo(quote.totalCost());
        assertThat(response.newBalance()).isEqualByComparingTo("8800");
        assertThat(data.playerShip().getPendingFuelAmount()).isEqualTo(20.0);
        assertThat(data.playerShip().getStatus()).isEqualTo(ShipStatus.REFUELING);
    }

    @Test
    void refuelRejectsInsufficientBalance() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(100), 40.0);

        assertThatThrownBy(() -> service.refuel(
                data.playerShip().getId(), data.playerId(), data.sessionId(), 60.0
        )).isInstanceOf(InsufficientFundsException.class);
    }

    private TestData stubBasePlayer(BigDecimal balance, double fuel) {
        TestData data = stubPlayerShipAndShip(fuel);
        BaseSessionPlayer player = BaseSessionPlayer.reconstruct(
                UUID.randomUUID(),
                data.playerId(),
                data.sessionId(),
                "Test Player",
                false,
                balance,
                null,
                UUID.randomUUID()
        );
        when(sessionPlayerRepository.findByUserIdAndSessionId(data.playerId(), data.sessionId()))
                .thenReturn(Optional.of(player));
        return data;
    }

    private TestData stubPlayerShipAndShip(double fuel) {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = Ship.create(
                "Test Ship", "Test", ShipClass.STANDARD,
                BigDecimal.valueOf(50_000), 100, 20.0, 5.0,
                BigDecimal.valueOf(500), BigDecimal.valueOf(200), 0.9, "icon.png", 10
        );
        PlayerShip playerShip = PlayerShip.reconstruct(
                UUID.randomUUID(), ship.getId(), playerId, sessionId, ShipStatus.AT_PORT,
                100.0, fuel, UUID.randomUUID(), null,
                null, null, null, null, null, null
        );
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        return new TestData(playerId, sessionId, playerShip);
    }

    private record TestData(UUID playerId, UUID sessionId, PlayerShip playerShip) {}
}
