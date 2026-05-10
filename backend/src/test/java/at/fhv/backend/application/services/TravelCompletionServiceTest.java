package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.travel.CargoUnloadingPhaseServiceImpl;
import at.fhv.backend.application.services.impl.travel.RewardCalculationServiceImpl;
import at.fhv.backend.application.services.impl.travel.TravelArrivalServiceImpl;
import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.rest.GameSessionWebSocketController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TravelCompletionServiceTest {


    @Nested
    class RewardCalculationServiceImplTest {
        private RewardCalculationServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new RewardCalculationServiceImpl();
        }

        private Travel buildTravel(UUID destinationPortId, BigDecimal baseReward) {
            return Travel.start(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, baseReward, 0);
        }

        private SessionCargo buildDeliveredCargo(UUID sessionId, UUID destinationPortId, BigDecimal reward, CargoType type) {
            UUID cargoId = UUID.randomUUID();
            SessionCargo cargo = SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    reward, false, 50,
                    type, 0.1,
                    CargoStatus.ASSIGNED, UUID.randomUUID(), UUID.randomUUID(), 0, 0, -1, -1
            );
            cargo.deliver();
            return cargo;
        }

        private SessionCargo buildExpiredCargo(UUID sessionId, UUID destinationPortId, BigDecimal reward, CargoType type) {
            UUID cargoId = UUID.randomUUID();
            return SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    reward, false, 50,
                    type, 0.1,
                    CargoStatus.EXPIRED, UUID.randomUUID(), UUID.randomUUID(), 0, 0, 3, -1
            );
        }

        @Test
        void givenDeliveredCargo_whenCalculateReward_thenReturnsFullReward() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);
            SessionCargo cargo = buildDeliveredCargo(sessionId, destinationPortId, BigDecimal.valueOf(1000), CargoType.GENERAL_GOODS);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.valueOf(1000));
        }

        @Test
        void givenExpiredGeneralGoodsCargo_whenCalculateReward_thenReturns40Percent() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);
            SessionCargo cargo = buildExpiredCargo(sessionId, destinationPortId, BigDecimal.valueOf(1000), CargoType.GENERAL_GOODS);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.valueOf(400));
        }

        @Test
        void givenExpiredFoodCargo_whenCalculateReward_thenReturnsZero() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);
            SessionCargo cargo = buildExpiredCargo(sessionId, destinationPortId, BigDecimal.valueOf(1000), CargoType.FOOD);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        void givenExpiredIndustrialGoodsCargo_whenCalculateReward_thenReturns50Percent() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);
            SessionCargo cargo = buildExpiredCargo(sessionId, destinationPortId, BigDecimal.valueOf(2000), CargoType.INDUSTRIAL_GOODS);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.valueOf(1000));
        }

        @Test
        void givenDeliveredCargoAndBaseReward_whenCalculateReward_thenReturnsCombined() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.valueOf(500));
            SessionCargo cargo = buildDeliveredCargo(sessionId, destinationPortId, BigDecimal.valueOf(1000), CargoType.GENERAL_GOODS);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.valueOf(1500));
        }

        @Test
        void givenMultipleCargos_whenCalculateReward_thenReturnsSumOfAllRewards() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);
            SessionCargo cargo1 = buildDeliveredCargo(sessionId, destinationPortId, BigDecimal.valueOf(1000), CargoType.GENERAL_GOODS);
            SessionCargo cargo2 = buildDeliveredCargo(sessionId, destinationPortId, BigDecimal.valueOf(500), CargoType.ELECTRONICS);

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo1, cargo2));

            assertThat(reward).isEqualByComparingTo(BigDecimal.valueOf(1500));
        }

        @Test
        void givenCargoWithWrongDestination_whenCalculateReward_thenIgnoresCargo() {
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            UUID otherPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, BigDecimal.ZERO);

            UUID cargoId = UUID.randomUUID();
            SessionCargo cargo = SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), otherPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.DELIVERED, UUID.randomUUID(), UUID.randomUUID(), 0, 5, -1, -1
            );

            BigDecimal reward = service.calculateTotalReward(travel, List.of(cargo));

            assertThat(reward).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        void givenNullReward_whenCalculateReward_thenReturnsZero() {
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(destinationPortId, null);

            BigDecimal reward = service.calculateTotalReward(travel, List.of());

            assertThat(reward).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @MockitoSettings(strictness = Strictness.LENIENT)
    class TravelArrivalServiceImplTest {
        @Mock private TravelRepository travelRepository;
        @Mock private PlayerShipRepository playerShipRepository;
        @Mock private GameSessionRepository gameSessionRepository;
        @Mock private CargoUnloadingPhaseService cargoUnloadingPhaseService;
        @Mock private SessionCargoRepository sessionCargoRepository;
        @Mock private SmuggleService smuggleService;

        private TravelArrivalServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new TravelArrivalServiceImpl(
                    travelRepository, playerShipRepository, sessionCargoRepository,
                    cargoUnloadingPhaseService, gameSessionRepository, smuggleService
            );
        }

        private Travel buildTravel(UUID playerShipId, UUID destinationPortId, UUID sessionId) {
            return Travel.start(playerShipId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);
        }

        private PlayerShip buildPlayerShip(UUID shipId) {
            PlayerShip ps = PlayerShip.createFromPurchase(shipId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
            ps.completeRegistration();
            ps.departForVoyage(UUID.randomUUID());
            return ps;
        }

        @Test
        void givenValidTravel_whenHandleArrival_thenTravelMarkedAsArrived() {
            UUID playerShipId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(playerShipId);

            when(sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId())).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            assertThat(travel.getTravelStatus()).isEqualTo(TravelStatus.ARRIVED);
            verify(travelRepository, times(1)).save(any(Travel.class));
        }

        @Test
        void givenValidTravel_whenHandleArrival_thenPlayerShipArrivesAtPort() {
            UUID playerShipId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(playerShipId);

            when(sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId())).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            assertThat(playerShip.getCurrentPortId()).isEqualTo(destinationPortId);
            verify(playerShipRepository, times(1)).save(any(PlayerShip.class));
        }

        @Test
        void givenCargoUnloadingNeeded_whenHandleArrival_thenShipSetToUnloading() {
            UUID playerShipId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(playerShipId);
            List<SessionCargo> cargos = List.of();

            when(sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId())).thenReturn(cargos);
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            assertThat(playerShip.getStatus()).isEqualTo(ShipStatus.UNLOADING);
        }
    }

    @Nested
    @MockitoSettings(strictness = Strictness.LENIENT)
    class CargoUnloadingPhaseServiceImplTest {
        @Mock private SessionCargoRepository sessionCargoRepository;
        @Mock private PlayerShipRepository playerShipRepository;
        @Mock private GameSessionRepository gameSessionRepository;
        @Mock private GameSessionWebSocketController webSocketController;
        @Mock private PortRepository portRepository;
        @Mock private CargoRepository cargoRepository;
        @Mock private SmuggleService smuggleService;
        @Mock private TravelRepository travelRepository;

        private CargoUnloadingPhaseServiceImpl service;

        @BeforeEach
        void setUp() {
            // Use the real RewardCalculationService so we test the full reward flow end-to-end.
            service = new CargoUnloadingPhaseServiceImpl(
                    sessionCargoRepository,
                    playerShipRepository,
                    gameSessionRepository,
                    new RewardCalculationServiceImpl(),
                    webSocketController,
                    portRepository,
                    cargoRepository,
                    smuggleService,
                    travelRepository
            );
        }

        private PlayerShip buildPlayerShipInUnloading(UUID destinationPortId) {
            PlayerShip ps = PlayerShip.createFromPurchase(
                    UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
            ps.completeRegistration();
            ps.departForVoyage(destinationPortId);
            ps.arriveAndStartUnloading(destinationPortId, 10);
            return ps;
        }

        private GameSession buildSessionWithPlayer(ISessionPlayer player) {
            GameSession session = new GameSession(UUID.randomUUID(), 4, 5, 100, Duration.ofMinutes(30));
            session.addPlayer(player);
            return session;
        }

        @Test
        void givenAssignedCargoWithReward_whenCompleteUnloadingPhase_thenPlayerBalanceIncreased() {
            UUID userId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();

            Travel travel = Travel.start(playerShipId, userId, sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);

            PlayerShip playerShip = buildPlayerShipInUnloading(destinationPortId);
            ISessionPlayer player = new BaseSessionPlayer(userId, sessionId, "TestPlayer", false);
            GameSession session = buildSessionWithPlayer(player);

            // ASSIGNED cargo (so unloadCargo will deliver it during the phase). Reward 1000.
            SessionCargo cargo = SessionCargo.reconstruct(
                    UUID.randomUUID(), UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.ASSIGNED, userId, playerShipId, 0, 5, -1, -1
            );

            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(inv -> inv.getArgument(0));
            when(sessionCargoRepository.save(any(SessionCargo.class))).thenAnswer(inv -> inv.getArgument(0));
            when(portRepository.findById(any())).thenReturn(Optional.empty());
            when(cargoRepository.findById(any())).thenReturn(Optional.empty());

            service.completeUnloadingPhase(travel, List.of(cargo));

            // 40000 (start) + 1000 (cargo reward) + 500 (base reward) = 41500
            assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("41500.00"));
        }

        @Test
        void givenNoCargoAndNoBaseReward_whenCompleteUnloadingPhase_thenPlayerBalanceUnchanged() {
            UUID userId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();

            Travel travel = Travel.start(playerShipId, userId, sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.ZERO, 0);

            PlayerShip playerShip = buildPlayerShipInUnloading(destinationPortId);
            ISessionPlayer player = new BaseSessionPlayer(userId, sessionId, "TestPlayer", false);
            GameSession session = buildSessionWithPlayer(player);
            BigDecimal initialBalance = player.getBalance();

            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(inv -> inv.getArgument(0));
            when(portRepository.findById(any())).thenReturn(Optional.empty());
            when(cargoRepository.findById(any())).thenReturn(Optional.empty());

            service.completeUnloadingPhase(travel, List.of());

            assertThat(player.getBalance()).isEqualByComparingTo(initialBalance);
        }

        @Test
        void givenAssignedCargo_whenCompleteUnloadingPhase_thenCargoEndsAsDelivered() {
            UUID userId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();

            Travel travel = Travel.start(playerShipId, userId, sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.ZERO, 0);

            PlayerShip playerShip = buildPlayerShipInUnloading(destinationPortId);
            ISessionPlayer player = new BaseSessionPlayer(userId, sessionId, "TestPlayer", false);
            GameSession session = buildSessionWithPlayer(player);

            SessionCargo cargo = SessionCargo.reconstruct(
                    UUID.randomUUID(), UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.ASSIGNED, userId, playerShipId, 0, 0, -1, -1
            );

            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(inv -> inv.getArgument(0));
            when(sessionCargoRepository.save(any(SessionCargo.class))).thenAnswer(inv -> inv.getArgument(0));
            when(portRepository.findById(any())).thenReturn(Optional.empty());
            when(cargoRepository.findById(any())).thenReturn(Optional.empty());

            service.completeUnloadingPhase(travel, List.of(cargo));

            assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("41000.00"));
            assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.DELIVERED);
        }
    }
}