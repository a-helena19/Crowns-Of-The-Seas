package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.impl.ship.RepairShipServiceImpl;
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
import at.fhv.backend.rest.dtos.ship.response.RepairQuoteDTO;
import at.fhv.backend.rest.dtos.ship.response.RepairResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepairShipServiceImplTest {

    @Mock private PlayerShipRepository playerShipRepository;
    @Mock private ShipRepository shipRepository;
    @Mock private SessionPlayerRepository sessionPlayerRepository;
    @Mock private GameTickScheduler gameTickScheduler;
    @Mock private GameSessionRepository gameSessionRepository;

    private RepairShipServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RepairShipServiceImpl(
                playerShipRepository,
                shipRepository,
                sessionPlayerRepository,
                gameTickScheduler,
                gameSessionRepository
        );
    }

    @Test
    void quoteUsesRepairPriceFactorOneHundredFifty() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(50_000), 60.0);

        RepairQuoteDTO quote = service.getRepairQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId()
        );

        assertThat(quote.repairNeededPercent()).isEqualTo(40.0);
        assertThat(quote.totalCost()).isEqualByComparingTo("12000");
    }

    @Test
    void quoteAppliesPlayerRepairCostModifier() {
        TestData data = stubPlayerShipAndShip(60.0);
        ISessionPlayer player = mock(ISessionPlayer.class);
        when(player.getRepairCostModifier()).thenReturn(0.75);
        when(player.getBalance()).thenReturn(BigDecimal.valueOf(50_000));
        when(sessionPlayerRepository.findByUserIdAndSessionId(data.playerId(), data.sessionId()))
                .thenReturn(Optional.of(player));

        RepairQuoteDTO quote = service.getRepairQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId()
        );

        assertThat(quote.totalCost()).isEqualByComparingTo("9000");
    }

    @Test
    void quoteAndRepairChargeUseTheSameCalculation() {
        TestData data = stubBasePlayer(BigDecimal.valueOf(50_000), 60.0);
        GameSession session = mock(GameSession.class);
        when(session.getCurrentTick()).thenReturn(20);
        when(gameSessionRepository.findById(data.sessionId())).thenReturn(Optional.of(session));

        RepairQuoteDTO quote = service.getRepairQuote(
                data.playerShip().getId(), data.playerId(), data.sessionId()
        );
        RepairResponseDTO response = service.repair(
                data.playerShip().getId(), data.playerId(), data.sessionId()
        );

        assertThat(response.totalCost()).isEqualByComparingTo(quote.totalCost());
        assertThat(response.newBalance()).isEqualByComparingTo("38000");
        assertThat(data.playerShip().getPendingRepairAmount()).isEqualTo(40.0);
        assertThat(data.playerShip().getStatus()).isEqualTo(ShipStatus.REPAIRING);
    }

    private TestData stubBasePlayer(BigDecimal balance, double condition) {
        TestData data = stubPlayerShipAndShip(condition);
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

    private TestData stubPlayerShipAndShip(double condition) {
        UUID playerId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        Ship ship = Ship.create(
                "Test Ship", "Test", ShipClass.STANDARD,
                BigDecimal.valueOf(50_000), 100, 20.0, 5.0,
                BigDecimal.valueOf(500), BigDecimal.valueOf(200), 0.9, "icon.png", 10
        );
        PlayerShip playerShip = PlayerShip.reconstruct(
                UUID.randomUUID(), ship.getId(), playerId, sessionId, ShipStatus.AT_PORT,
                condition, 100.0, UUID.randomUUID(), null,
                null, null, null, null, null, null
        );
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
        return new TestData(playerId, sessionId, playerShip);
    }

    private record TestData(UUID playerId, UUID sessionId, PlayerShip playerShip) {}
}
