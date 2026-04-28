package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.travel.CargoUnloadServiceImpl;
import at.fhv.backend.application.services.impl.travel.RewardCalculationServiceImpl;
import at.fhv.backend.application.services.impl.travel.TravelArrivalServiceImpl;
import at.fhv.backend.application.services.travel.CargoUnloadService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
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
    @MockitoSettings(strictness = Strictness.LENIENT)
    class CargoUnloadServiceImplTest {
        @Mock private SessionCargoRepository sessionCargoRepository;
        private CargoUnloadServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new CargoUnloadServiceImpl(sessionCargoRepository);
        }

        private Travel buildTravel(UUID playerShipId, UUID destinationPortId, int arrivalTick) {
            return Travel.start(playerShipId, UUID.randomUUID(), UUID.randomUUID(),
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), arrivalTick);
        }

        private SessionCargo buildAssignedCargo(UUID sessionId, UUID playerShipId, UUID destinationPortId) {
            UUID cargoId = UUID.randomUUID();
            return SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.ASSIGNED, UUID.randomUUID(), playerShipId, 0, 5, -1, -1
            );
        }

        private SessionCargo buildExpiredCargo(UUID sessionId, UUID playerShipId, UUID destinationPortId) {
            UUID cargoId = UUID.randomUUID();
            return SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.FOOD, 0.1,
                    CargoStatus.EXPIRED, UUID.randomUUID(), playerShipId, 0, 3, 3, -1
            );
        }

        @Test
        void givenAssignedCargo_whenUnload_thenCargoStatusChangesToDelivered() {
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, 10);
            SessionCargo cargo = buildAssignedCargo(sessionId, playerShipId, destinationPortId);

            when(sessionCargoRepository.save(any(SessionCargo.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            service.unloadCargoForTravel(travel, List.of(cargo));

            // Nach Entladen geht Cargo in INACTIVE (Cooldown) Phase
            assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.INACTIVE);
            verify(sessionCargoRepository, times(1)).save(any(SessionCargo.class));
        }

        @Test
        void givenExpiredCargo_whenUnload_thenCargoStatusChangesToInactive() {
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, 10);
            SessionCargo cargo = buildExpiredCargo(sessionId, playerShipId, destinationPortId);

            when(sessionCargoRepository.save(any(SessionCargo.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            service.unloadCargoForTravel(travel, List.of(cargo));

            // Auch expiriertes Cargo geht in INACTIVE (Cooldown)
            assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.INACTIVE);
            verify(sessionCargoRepository, times(1)).save(any(SessionCargo.class));
        }

        @Test
        void givenCargoWithWrongShip_whenUnload_thenCargoNotUnloaded() {
            UUID playerShipId = UUID.randomUUID();
            UUID otherShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, 10);

            UUID cargoId = UUID.randomUUID();
            SessionCargo cargo = SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, 50,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.ASSIGNED, UUID.randomUUID(), otherShipId, 0, 5, -1, -1
            );

            service.unloadCargoForTravel(travel, List.of(cargo));

            assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
            verify(sessionCargoRepository, never()).save(any(SessionCargo.class));
        }

        @Test
        void givenMultipleCargos_whenUnload_thenOnlyRelevantCargoIsUnloaded() {
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, 10);

            SessionCargo relevantCargo = buildAssignedCargo(sessionId, playerShipId, destinationPortId);
            SessionCargo irrelevantCargo = buildAssignedCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());

            when(sessionCargoRepository.save(any(SessionCargo.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            service.unloadCargoForTravel(travel, List.of(relevantCargo, irrelevantCargo));

            // Relevant cargo wird entladen und geht in INACTIVE (Cooldown)
            assertThat(relevantCargo.getCargoStatus()).isEqualTo(CargoStatus.INACTIVE);
            // Irrelevant cargo bleibt unverändert
            assertThat(irrelevantCargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
            verify(sessionCargoRepository, times(1)).save(any(SessionCargo.class));
        }
    }

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
                    CargoStatus.ASSIGNED, UUID.randomUUID(), UUID.randomUUID(), 0, 5, -1, -1
            );
            cargo.deliver();
            return cargo;
        }

        private SessionCargo buildExpiredCargo(UUID sessionId, UUID destinationPortId, BigDecimal reward, CargoType type) {
            UUID cargoId = UUID.randomUUID();
            SessionCargo cargo = SessionCargo.reconstruct(
                    cargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    reward, false, 50,
                    type, 0.1,
                    CargoStatus.EXPIRED, UUID.randomUUID(), UUID.randomUUID(), 0, 3, 3, -1
            );
            return cargo;
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
            UUID sessionId = UUID.randomUUID();
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
        @Mock private CargoUnloadService cargoUnloadService;
        @Mock private RewardCalculationService rewardCalculationService;
        @Mock private GameSessionWebSocketController webSocketController;
        @Mock private SessionCargoRepository sessionCargoRepository;
        @Mock private PortRepository portRepository;
        @Mock private CargoRepository cargoRepository;

        private TravelArrivalServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new TravelArrivalServiceImpl(
                    travelRepository, playerShipRepository, gameSessionRepository,
                    cargoUnloadService, rewardCalculationService, webSocketController,
                    sessionCargoRepository, portRepository, cargoRepository
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

        private GameSession buildGameSession(UUID hostId) {
            return new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        }

        @Test
        void givenValidTravel_whenHandleArrival_thenTravelMarkedAsArrived() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(UUID.randomUUID());

            when(sessionCargoRepository.findByAssignedPlayerId(playerId)).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(cargoUnloadService).unloadCargoForTravel(any(Travel.class), any());
            when(rewardCalculationService.calculateTotalReward(travel, List.of())).thenReturn(BigDecimal.ZERO);
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            assertThat(travel.getTravelStatus()).isEqualTo(TravelStatus.ARRIVED);
            verify(travelRepository, times(1)).save(any(Travel.class));
        }

        @Test
        void givenValidTravel_whenHandleArrival_thenPlayerShipArrivesAtPort() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(UUID.randomUUID());

            when(sessionCargoRepository.findByAssignedPlayerId(playerId)).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(cargoUnloadService).unloadCargoForTravel(any(Travel.class), any());
            when(rewardCalculationService.calculateTotalReward(travel, List.of())).thenReturn(BigDecimal.ZERO);
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            assertThat(playerShip.getCurrentPortId()).isEqualTo(destinationPortId);
            verify(playerShipRepository, times(1)).save(any(PlayerShip.class));
        }

        @Test
        void givenRewardAvailable_whenHandleArrival_thenPlayerBalanceIncreased() {
            UUID userId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            // Erstelle eine Travel mit userId als playerId
            Travel travel = Travel.start(playerShipId, userId, sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);
            PlayerShip playerShip = buildPlayerShip(UUID.randomUUID());

            ISessionPlayer player = new BaseSessionPlayer(userId, sessionId, "TestPlayer", false);
            GameSession session = buildGameSession(UUID.randomUUID());
            session.addPlayer(player);
            BigDecimal reward = BigDecimal.valueOf(1000);

            when(sessionCargoRepository.findByAssignedPlayerId(userId)).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(cargoUnloadService).unloadCargoForTravel(any(Travel.class), any());
            when(rewardCalculationService.calculateTotalReward(travel, List.of())).thenReturn(reward);
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(inv -> inv.getArgument(0));

            service.handleArrival(travel);

            assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("41000.00"));
        }

        @Test
        void givenNoReward_whenHandleArrival_thenPlayerBalanceUnchanged() {
            UUID userId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            // Erstelle Travel mit userId als playerId
            Travel travel = Travel.start(playerShipId, userId, sessionId,
                    UUID.randomUUID(), destinationPortId, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);
            PlayerShip playerShip = buildPlayerShip(UUID.randomUUID());

            ISessionPlayer player = new BaseSessionPlayer(userId, sessionId, "TestPlayer", false);
            GameSession session = buildGameSession(UUID.randomUUID());
            session.addPlayer(player);
            BigDecimal initialBalance = player.getBalance();

            when(sessionCargoRepository.findByAssignedPlayerId(userId)).thenReturn(List.of());
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(cargoUnloadService).unloadCargoForTravel(any(Travel.class), any());
            when(rewardCalculationService.calculateTotalReward(travel, List.of())).thenReturn(BigDecimal.ZERO);
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(inv -> inv.getArgument(0));

            service.handleArrival(travel);

            assertThat(player.getBalance()).isEqualByComparingTo(initialBalance);
        }

        @Test
        void givenCargoUnloadingNeeded_whenHandleArrival_thenCargoUnloadServiceCalled() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, destinationPortId, sessionId);
            PlayerShip playerShip = buildPlayerShip(UUID.randomUUID());
            List<SessionCargo> cargos = List.of();

            when(sessionCargoRepository.findByAssignedPlayerId(playerId)).thenReturn(cargos);
            when(travelRepository.save(any(Travel.class))).thenAnswer(inv -> inv.getArgument(0));
            when(playerShipRepository.findById(playerShipId)).thenReturn(Optional.of(playerShip));
            when(playerShipRepository.save(any(PlayerShip.class))).thenAnswer(inv -> inv.getArgument(0));
            doNothing().when(cargoUnloadService).unloadCargoForTravel(any(Travel.class), any());
            when(rewardCalculationService.calculateTotalReward(travel, cargos)).thenReturn(BigDecimal.ZERO);
            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            service.handleArrival(travel);

            verify(cargoUnloadService, times(1)).unloadCargoForTravel(travel, cargos);
        }
    }
}

