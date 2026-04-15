package at.fhv.backend.application.services;


import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.impl.travel.PortInfoHelper;
import at.fhv.backend.application.services.impl.travel.StartTravelServiceImpl;
import at.fhv.backend.application.services.impl.travel.ValidateTravelServiceImpl;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.infrastructure.mapper.TravelMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TravelServiceImplTest {
    @Nested
    class ValidateTravelServiceImplTest {
        private ValidateTravelService validateTravelService;

        @BeforeEach
        void setUp() {
            validateTravelService = new ValidateTravelServiceImpl();
        }

        private PlayerShip buildAtPortShip(UUID playerId) {
            PlayerShip ps = PlayerShip.createFromPurchase(UUID.randomUUID(), playerId, UUID.randomUUID(), UUID.randomUUID());
            ps.completeRegistration(); // -> AT_PORT
            return ps;
        }

        @Test
        void givenValidData_whenValidateTravelStart_thenNoExceptionIsThrown() {
            UUID playerId = UUID.randomUUID();
            UUID originPort = UUID.randomUUID();
            UUID destinationPort = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);

            assertThatNoException().isThrownBy(() -> validateTravelService.validateTravelStart(playerShip, playerId, originPort, destinationPort, 20.0)
            );
        }

        @Test
        void givenWrongOwner_whenValidateTravelStart_thenThrowsShipNotOwnedException() {
            UUID realOwner = UUID.randomUUID();
            UUID otherPlayer = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(realOwner);

            assertThatThrownBy(() -> validateTravelService.validateTravelStart(playerShip, otherPlayer, UUID.randomUUID(), UUID.randomUUID(), 10.0)
            ).isInstanceOf(ShipNotOwnedException.class);
        }

        @Test
        void givenShipNotAtPort_whenValidateTravelStart_thenThrowsInvalidShipStatusTransition() {
            UUID playerId = UUID.randomUUID();
            PlayerShip playerShip = PlayerShip.createFromPurchase(UUID.randomUUID(), playerId, UUID.randomUUID(), UUID.randomUUID());

            assertThatThrownBy(() -> validateTravelService.validateTravelStart(playerShip, playerId, UUID.randomUUID(), UUID.randomUUID(), 10.0)
            ).isInstanceOf(InvalidShipStatusTransition.class);
        }

        @Test
        void givenSameOriginAndDestination_whenValidateTravelStart_thenThrowsSamePortException() {
            UUID playerId = UUID.randomUUID();
            UUID port = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);

            assertThatThrownBy(() -> validateTravelService.validateTravelStart(playerShip, playerId, port, port, 10.0)
            ).isInstanceOf(SamePortException.class);
        }

        @Test
        void givenOriginPortIsNull_whenValidateTravelStart_thenNoSamePortCheck() {
            UUID playerId = UUID.randomUUID();
            UUID destinationPort = UUID.randomUUID();
            PlayerShip playerShip = buildAtPortShip(playerId);

            assertThatNoException().isThrownBy(() ->
                    validateTravelService.validateTravelStart(playerShip, playerId, null, destinationPort, 10.0)
            );
        }
    }

    @Nested
    class StartTravelServiceImplTest {
        @Mock
        private PlayerShipRepository playerShipRepository;
        @Mock
        private ShipRepository shipRepository;
        @Mock
        private PortInfoHelper portInfoHelper;
        @Mock
        private CalculateFuelConsumptionService calculateFuelConsumptionService;
        @Mock
        private ValidateTravelService validateTravelService;
        @Mock
        private TravelRepository travelRepository;
        @Mock
        private TravelMapper travelMapper;
        @Mock
        private TravelResponseMapper travelResponseMapper;
        @Mock
        private GameSessionRepository gameSessionRepository;
        @Mock
        private GameTickScheduler gameTickScheduler;

        private StartTravelServiceImpl service;

        @BeforeEach
        void setUp() {
            org.mockito.MockitoAnnotations.openMocks(this);
            service = new StartTravelServiceImpl(
                    playerShipRepository, shipRepository, portInfoHelper,
                    calculateFuelConsumptionService, validateTravelService,
                    travelRepository, travelMapper, travelResponseMapper,
                    gameSessionRepository, gameTickScheduler
            );
        }

        private Ship buildShip() {
            return Ship.create("Speeder", "fast", ShipClass.PREMIUM,
                    BigDecimal.valueOf(5000), 200, 20.0, 3.0,
                    BigDecimal.valueOf(600), BigDecimal.valueOf(300), 0.95, "icon.png");
        }

        private PlayerShip buildAtPortShip(UUID playerId, UUID sessionId, UUID shipId) {
            PlayerShip ps = PlayerShip.createFromPurchase(shipId, playerId, sessionId, UUID.randomUUID());
            ps.completeRegistration();
            return ps;
        }

        private StartTravelDTO buildStartTravelDTO(UUID playerShipId, UUID destinationPortId) {
            StartTravelDTO dto = new StartTravelDTO();
            dto.setPlayerShipId(playerShipId);
            dto.setDestinationPortId(destinationPortId);
            dto.setSpeedSetting(1.0);
            return dto;
        }

        private Travel buildTravel(UUID playerShipId, UUID playerId, UUID sessionId) {
            UUID origin = UUID.randomUUID();
            UUID destination = UUID.randomUUID();
            return Travel.start(playerShipId, playerId, sessionId, origin, destination, 5.0, 1.0, 0.1, BigDecimal.valueOf(500), 0);
        }

        @Test
        void givenValidRequest_whenStartTravel_thenTravelRepositorySaveIsCalled() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(java.util.Optional.of(new at.fhv.backend.domain.model.session.GameSession(playerId, 4, 5, 100, java.time.Duration.ofMinutes(30))));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(portInfoHelper.getDistance(any(), eq(destinationPortId))).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(ship, 5.0)).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any(Travel.class))).thenReturn(travel);
            when(travelResponseMapper.toResponse(travel)).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId));
            verify(travelRepository, times(1)).save(any(Travel.class));
        }

        @Test
        void givenValidRequest_whenStartTravel_thenPlayerShipStatusChangesToEnRoute() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);

            when(gameSessionRepository.findById(sessionId)).thenReturn(java.util.Optional.of(new at.fhv.backend.domain.model.session.GameSession(playerId, 4, 5, 100, java.time.Duration.ofMinutes(30))));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(portInfoHelper.getDistance(any(), eq(destinationPortId))).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(ship, 5.0)).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(any())).thenReturn(new TravelDTO());

            service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId));
            assertThat(playerShip.getStatus().name()).isEqualTo("EN_ROUTE");
        }

        @Test
        void givenUnknownPlayerShip_whenStartTravel_thenThrowsShipNotFoundException() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID unknownShipId = UUID.randomUUID();

            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(unknownShipId, playerId, sessionId)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.startTravel(playerId, sessionId, buildStartTravelDTO(unknownShipId, UUID.randomUUID()))
            ).isInstanceOf(ShipNotFoundException.class);
        }

        @Test
        void givenValidRequest_whenStartTravel_thenReturnedTravelDTOIsNotNull() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            Ship ship = buildShip();
            PlayerShip playerShip = buildAtPortShip(playerId, sessionId, ship.getId());
            UUID destinationPortId = UUID.randomUUID();
            Travel travel = buildTravel(playerShip.getId(), playerId, sessionId);
            TravelDTO expectedDto = new TravelDTO();

            when(gameSessionRepository.findById(sessionId)).thenReturn(java.util.Optional.of(new at.fhv.backend.domain.model.session.GameSession(playerId, 4, 5, 100, java.time.Duration.ofMinutes(30))));
            when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
            when(shipRepository.findById(ship.getId())).thenReturn(Optional.of(ship));
            when(portInfoHelper.getDistance(any(), eq(destinationPortId))).thenReturn(5.0);
            when(calculateFuelConsumptionService.calculateFuelConsumption(ship, 5.0)).thenReturn(10.0);
            doNothing().when(validateTravelService).validateTravelStart(any(), any(), any(), any(), anyDouble());
            when(playerShipRepository.save(any())).thenReturn(playerShip);
            when(travelRepository.save(any())).thenReturn(travel);
            when(travelResponseMapper.toResponse(travel)).thenReturn(expectedDto);

            TravelDTO result = service.startTravel(playerId, sessionId, buildStartTravelDTO(playerShip.getId(), destinationPortId));
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
            assertThatThrownBy(() -> service.getTravelStatus(travelId, playerId)).isInstanceOf(TravelNotFoundException.class);
        }

        @Test
        void givenTravelOwnedByOtherPlayer_whenGetTravelStatus_thenThrowsShipNotFoundException() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID otherPlayerId = UUID.randomUUID();
            UUID playerShipId = UUID.randomUUID();
            Travel travel = buildTravel(playerShipId, otherPlayerId, sessionId);

            when(travelRepository.findById(travel.getTravelId())).thenReturn(Optional.of(travel));

            assertThatThrownBy(() -> service.getTravelStatus(travel.getTravelId(), playerId)).isInstanceOf(ShipNotFoundException.class);
        }

        @Test
        void givenPlayerWithActiveTravels_whenGetActiveTravels_thenReturnsAllInProgress() {
            UUID playerId = UUID.randomUUID();
            UUID sessionId = UUID.randomUUID();
            UUID shipId = UUID.randomUUID();
            Travel travel = buildTravel(shipId, playerId, sessionId);
            TravelDTO dto = new TravelDTO();

            when(travelRepository.findAllByPlayerIdAndStatus(playerId, TravelStatus.IN_PROGRESS)).thenReturn(List.of(travel));
            when(travelResponseMapper.toResponse(travel)).thenReturn(dto);

            List<TravelDTO> result = service.getActiveTravels(playerId);
            assertThat(result).hasSize(1);
        }

        @Test
        void givenPlayerWithNoActiveTravels_whenGetActiveTravels_thenReturnsEmptyList() {
            UUID playerId = UUID.randomUUID();

            when(travelRepository.findAllByPlayerIdAndStatus(playerId, TravelStatus.IN_PROGRESS)).thenReturn(List.of());
            List<TravelDTO> result = service.getActiveTravels(playerId);
            assertThat(result).isEmpty();
        }
    }
}

