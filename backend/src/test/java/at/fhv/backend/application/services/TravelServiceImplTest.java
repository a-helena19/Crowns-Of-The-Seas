package at.fhv.backend.application.services;

import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.impl.travel.PendingTravelStartServiceImpl;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.application.services.travel.PendingTravelStartService;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.rest.CargoWebSocketController;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.impl.travel.StartTravelServiceImpl;
import at.fhv.backend.application.services.impl.travel.ValidateTravelServiceImpl;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;

@ExtendWith(MockitoExtension.class)
class TravelServiceImplTest {
    @Nested
    class ValidateTravelServiceImplTest {
        private ValidateTravelService validateTravelService;

        @BeforeEach
        void setUp() {
            validateTravelService = new ValidateTravelServiceImpl();
        }

        private Ship buildShip() {
            return Ship.create("Speeder", "fast", ShipClass.PREMIUM,
                    BigDecimal.valueOf(5000), 200, 20.0, 3.0,
                    BigDecimal.valueOf(600), BigDecimal.valueOf(300), 0.95, "icon.png", 20);
        }

        private PlayerShip buildAtPortShip(UUID playerId) {
            PlayerShip ps = PlayerShip.createFromPurchase(UUID.randomUUID(), playerId, UUID.randomUUID(), UUID.randomUUID());
            ps.completeRegistration();
            ps.startLoading(UUID.randomUUID(), 1);
            ps.completeLoading();
            return ps;
        }

        @Test
        void givenValidData_whenValidateTravelStart_thenNoExceptionIsThrown() {
            UUID playerId = UUID.randomUUID();
            UUID originPort = UUID.randomUUID();
            UUID destinationPort = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);
            playerShip.consumeFuel(80.0);
            Ship ship = buildShip();

            assertThatNoException().isThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, playerId, originPort, destinationPort, 20.0)
            );
        }

        @Test
        void givenWrongOwner_whenValidateTravelStart_thenThrowsShipNotOwnedException() {
            UUID realOwner = UUID.randomUUID();
            UUID otherPlayer = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(realOwner);
            Ship ship = buildShip();

            assertThatThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, otherPlayer, UUID.randomUUID(), UUID.randomUUID(), 10.0)
            ).isInstanceOf(ShipNotOwnedException.class);
        }

        @Test
        void givenShipNotAtPort_whenValidateTravelStart_thenThrowsInvalidShipStatusTransition() {
            UUID playerId = UUID.randomUUID();
            PlayerShip playerShip = PlayerShip.createFromPurchase(UUID.randomUUID(), playerId, UUID.randomUUID(), UUID.randomUUID());
            // still IN_REGISTRATION
            Ship ship = buildShip();

            assertThatThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, playerId, UUID.randomUUID(), UUID.randomUUID(), 10.0)
            ).isInstanceOf(InvalidShipStatusTransition.class);
        }

        @Test
        void givenSameOriginAndDestination_whenValidateTravelStart_thenThrowsSamePortException() {
            UUID playerId = UUID.randomUUID();
            UUID port = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);
            Ship ship = buildShip();

            assertThatThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, playerId, port, port, 10.0)
            ).isInstanceOf(SamePortException.class);
        }

        @Test
        void givenOriginPortIsNull_whenValidateTravelStart_thenNoSamePortCheck() {
            UUID playerId = UUID.randomUUID();
            UUID destinationPort = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);
            Ship ship = buildShip();

            assertThatNoException().isThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, playerId, null, destinationPort, 10.0)
            );
        }

        @Test
        void givenInsufficientFuel_whenValidateTravelStart_thenThrowsInsufficientFuelException() {
            UUID playerId = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);
            playerShip.consumeFuel(95.0);
            Ship ship = buildShip();

            assertThatThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, ship, playerId, UUID.randomUUID(), UUID.randomUUID(), 50.0)
            ).isInstanceOf(at.fhv.backend.domain.model.exception.InsufficientFuelException.class);
        }
    }

    @Nested
    class StartTravelServiceImplTest {
        @Mock private PlayerShipRepository playerShipRepository;
        @Mock private ShipRepository shipRepository;
        @Mock private PortQueryService portQueryService;
        @Mock private CalculateFuelConsumptionService calculateFuelConsumptionService;
        @Mock private ValidateTravelService validateTravelService;
        @Mock private TravelRepository travelRepository;
        @Mock private TravelResponseMapper travelResponseMapper;
        @Mock private GameSessionRepository gameSessionRepository;
        @Mock private GameTickScheduler gameTickScheduler;
        @Mock private SessionCargoRepository sessionCargoRepository;
        @Mock private CargoWebSocketController cargoWebSocketController;
        @Mock private PortDistanceForCargoService portDistanceForCargoService;
        @Mock private SessionPlayerRepository sessionPlayerRepository;
        @Mock private SmuggleService smuggleService;
        @Mock private PendingTravelStartServiceImpl pendingTravelStartService;


        private StartTravelServiceImpl service;

        @BeforeEach
        void setUp() {
            service = new StartTravelServiceImpl(
                    playerShipRepository, shipRepository, portQueryService,
                    calculateFuelConsumptionService, validateTravelService,
                    travelRepository, travelResponseMapper,
                    gameSessionRepository, gameTickScheduler,
                    sessionCargoRepository, cargoWebSocketController,
                    portDistanceForCargoService, sessionPlayerRepository, smuggleService, pendingTravelStartService
            );
        }

        private Ship buildShip() {
            return Ship.create("Speeder", "fast", ShipClass.PREMIUM,
                    BigDecimal.valueOf(5000), 200, 20.0, 3.0,
                    BigDecimal.valueOf(600), BigDecimal.valueOf(300), 0.95, "icon.png", 20);
        }

        private PlayerShip buildAtPortShip(UUID playerId, UUID sessionId, UUID shipId) {
            PlayerShip ps = PlayerShip.createFromPurchase(shipId, playerId, sessionId, UUID.randomUUID());
            ps.completeRegistration();
            ps.startLoading(UUID.randomUUID(), 1);
            ps.completeLoading();
            return ps;
        }

        private StartTravelDTO buildStartTravelDTO(UUID playerShipId, UUID destinationPortId, UUID sessionCargoId) {
            StartTravelDTO dto = new StartTravelDTO();
            dto.setPlayerShipId(playerShipId);
            dto.setDestinationPortId(destinationPortId);
            dto.setSessionCargoId(sessionCargoId);
            dto.setSpeedSetting(1.0);
            return dto;
        }

        private Travel buildTravel(UUID playerShipId, UUID playerId, UUID sessionId) {
            UUID origin = UUID.randomUUID();
            UUID destination = UUID.randomUUID();
            return Travel.start(playerShipId, playerId, sessionId, origin, destination, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);
        }

        private GameSession buildGameSession(UUID hostId) {
            return new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        }

        private SessionCargo buildAvailableCargo(UUID sessionCargoId, UUID destinationPortId, UUID sessionId, int capacity) {
            return SessionCargo.reconstruct(
                    sessionCargoId, UUID.randomUUID(), sessionId,
                    UUID.randomUUID(), destinationPortId,
                    BigDecimal.valueOf(1000), false, capacity,
                    CargoType.GENERAL_GOODS, 0.1,
                    CargoStatus.ASSIGNED, UUID.randomUUID(), UUID.randomUUID(),
                    0, -1, -1, -1
            );
        }

        @Test
        void givenValidRequest_whenStartTravel_thenTravelRepositorySaveIsCalled() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any(Travel.class))).thenReturn(travel);
            when(travelResponseMapper.toResponse(travel)).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            verify(travelRepository, times(1)).save(any(Travel.class));
        }

        @Test
        void givenValidRequest_whenStartTravel_thenPlayerShipStatusChangesToEnRoute() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(playerShip.getStatus().name()).isEqualTo("EN_ROUTE");
        }

        @Test
        void givenValidRequest_whenStartTravel_thenFuelIsDeducted() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);
            double fuelBefore = playerShip.getFuel();

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(15.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(playerShip.getFuel()).isLessThan(fuelBefore);
        }

        @Test
        void givenValidRequest_whenStartTravel_thenConditionIsReduced() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);
            double conditionBefore = playerShip.getCondition();

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(15.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(playerShip.getCondition()).isLessThan(conditionBefore);
        }

        @Test
        void givenValidRequest_whenStartTravel_thenConditionWearIsLowerThanFuelLoss() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);
            double fuelBefore = playerShip.getFuel();
            double conditionBefore = playerShip.getCondition();

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(120.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            double fuelLoss = fuelBefore - playerShip.getFuel();
            double conditionLoss = conditionBefore - playerShip.getCondition();
            assertThat(conditionLoss).isGreaterThan(0);
            assertThat(conditionLoss).isLessThan(fuelLoss);
        }

        @Test
        void givenHigherFuelConsumption_whenStartTravel_thenConditionWearIsHigher() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip lowWearShip = buildAtPortShip(playerId, sessionId, ship.getId());
            PlayerShip highWearShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID lowCargoId = UUID.randomUUID();
            UUID highCargoId = UUID.randomUUID();
            SessionCargo lowCargo = buildAvailableCargo(lowCargoId, destinationPortId, sessionId, 50);
            SessionCargo highCargo = buildAvailableCargo(highCargoId, destinationPortId, sessionId, 50);
            Travel lowTravel = buildTravel(lowWearShip.getId(), playerId, sessionId);
            Travel highTravel = buildTravel(highWearShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(lowWearShip.getId(), playerId, sessionId)).thenReturn(Optional.of(lowWearShip));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(highWearShip.getId(), playerId, sessionId)).thenReturn(Optional.of(highWearShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(lowCargoId)).thenReturn(Optional.of(lowCargo));
            when(sessionCargoRepository.findByIdForUpdate(highCargoId)).thenReturn(Optional.of(highCargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(15.0, 120.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(travelRepository.save(any())).thenReturn(lowTravel, highTravel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(lowWearShip.getId(), destinationPortId, lowCargoId));
            service.startTravel(playerId, sessionId, buildStartTravelDTO(highWearShip.getId(), destinationPortId, highCargoId));

            double lowConditionLoss = 100.0 - lowWearShip.getCondition();
            double highConditionLoss = 100.0 - highWearShip.getCondition();
            assertThat(highConditionLoss).isGreaterThan(lowConditionLoss);
        }

        @Test
        void givenVeryWornShip_whenStartTravel_thenConditionDoesNotFallBelowZero() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            playerShip.applyWear(99.0);
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(1000.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(playerShip.getCondition()).isZero();
        }

        @Test
        void givenUnknownPlayerShip_whenStartTravel_thenThrowsShipNotFoundException() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID unknownShipId = UUID.randomUUID();

            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(unknownShipId, playerId, sessionId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    service.startTravel(playerId, sessionId,
                            buildStartTravelDTO(unknownShipId, UUID.randomUUID(), UUID.randomUUID()))
            ).isInstanceOf(ShipNotFoundException.class);
        }

//        @Test
//        void givenCargoAlreadyAssigned_whenStartTravel_thenThrowsCargoNotAvailableException() {
//            UUID playerId = UUID.randomUUID();
//            UUID sessionId = UUID.randomUUID();
//            Ship ship = buildShip();
//            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
//            UUID destinationPortId = UUID.randomUUID();
//            UUID sessionCargoId = UUID.randomUUID();
//
//            GameSession session = new GameSession(playerId, 4, 5, 100, Duration.ofMinutes(30));
//
//            SessionCargo unavailableCargo = SessionCargo.reconstruct(
//                    sessionCargoId, UUID.randomUUID(), sessionId,
//                    UUID.randomUUID(), destinationPortId,
//                    BigDecimal.valueOf(1000), false, 50,
//                    CargoType.GENERAL_GOODS, 0.1,
//                    CargoStatus.ASSIGNED, UUID.randomUUID(), UUID.randomUUID(), 0, 5, -1, -1
//            );
//
//            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
//                    .thenReturn(Optional.of(playerShip));
//            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
//            when(gameSessionRepository.findByIdWithLock(sessionId)).thenReturn(Optional.of(session));
//            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(unavailableCargo));
//
//            assertThatThrownBy(() ->
//                    service.startTravel(playerId, sessionId,
//                            buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId))
//            ).isInstanceOf(at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException.class);
//        }

        @Test
        void givenValidRequest_whenStartTravel_thenCargoStatusChangesToAssigned() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
        }

        @Test
        void givenValidRequest_whenStartTravel_thenReturnedTravelDTOIsNotNull() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            UUID sessionCargoId = UUID.randomUUID();
            SessionCargo cargo = buildAvailableCargo(sessionCargoId, destinationPortId, sessionId, 50);
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);
            TravelDTO expectedDto = new TravelDTO();

            when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(buildGameSession(playerId)));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(sessionCargoRepository.findByIdForUpdate(sessionCargoId)).thenReturn(Optional.of(cargo));
            when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
            when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(eq(ship), anyDouble())).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(travel)).thenReturn(expectedDto);

            TravelDTO result = service.startTravel(playerId, sessionId,
                    buildStartTravelDTO(playerShip.getId(), destinationPortId, sessionCargoId));

            assertThat(result).isNotNull();
        }

        @Test
        void givenExistingTravel_whenGetTravelStatus_thenReturnsMappedDTO() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, playerId, sessionId);
            TravelDTO expectedDto = new TravelDTO();

            when(travelRepository.findById(travel.getTravelId())).thenReturn(Optional.of(travel));
            when(travelResponseMapper.toResponse(travel)).thenReturn(expectedDto);

            TravelDTO result = service.getTravelStatus(travel.getTravelId(), playerId);

            assertThat(result).isEqualTo(expectedDto);
        }

        @Test
        void givenUnknownTravelId_whenGetTravelStatus_thenThrowsTravelNotFoundException() {
            UUID travelId = UUID.randomUUID();
            UUID playerId = UUID.randomUUID();

            when(travelRepository.findById(travelId)).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    service.getTravelStatus(travelId, playerId)
            ).isInstanceOf(TravelNotFoundException.class);
        }

        @Test
        void givenTravelOwnedByOtherPlayer_whenGetTravelStatus_thenThrowsShipNotFoundException() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID otherPlayerId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, otherPlayerId, sessionId);

            when(travelRepository.findById(travel.getTravelId())).thenReturn(Optional.of(travel));

            assertThatThrownBy(() ->
                    service.getTravelStatus(travel.getTravelId(), playerId)
            ).isInstanceOf(ShipNotFoundException.class);
        }

        @Test
        void givenPlayerWithActiveTravels_whenGetActiveTravels_thenReturnsAllInProgress() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID shipId = UUID.randomUUID();
            Travel travel = buildTravel(shipId, playerId, sessionId);
            TravelDTO dto = new TravelDTO();

            when(travelRepository.findAllByPlayerIdAndStatus(playerId, TravelStatus.IN_PROGRESS))
                    .thenReturn(List.of(travel));
            when(travelResponseMapper.toResponse(travel)).thenReturn(dto);

            List<TravelDTO> result = service.getActiveTravels(playerId);

            assertThat(result).hasSize(1);
        }

        @Test
        void givenPlayerWithNoActiveTravels_whenGetActiveTravels_thenReturnsEmptyList() {
            UUID playerId = UUID.randomUUID();

            when(travelRepository.findAllByPlayerIdAndStatus(playerId, TravelStatus.IN_PROGRESS))
                    .thenReturn(List.of());

            List<TravelDTO> result = service.getActiveTravels(playerId);

            assertThat(result).isEmpty();
        }
    }
}
