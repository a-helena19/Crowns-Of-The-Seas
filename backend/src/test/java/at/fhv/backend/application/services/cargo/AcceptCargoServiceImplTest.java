package at.fhv.backend.application.services.cargo;


import at.fhv.backend.application.services.impl.cargo.AcceptCargoServiceImpl;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.SessionStatus;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.*;
import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcceptCargoServiceImplTest {

    @Mock private SessionCargoRepository sessionCargoRepository;
    @Mock private CargoRepository cargoRepository;
    @Mock private PlayerShipRepository playerShipRepository;
    @Mock private ShipRepository shipRepository;
    @Mock private GameSessionRepository gameSessionRepository;
    @Mock private PortQueryService portQueryService;
    @Mock private PortDistanceForCargoService portDistanceForCargoService;
    @Mock private SessionPlayerRepository sessionPlayerRepository;

    private AcceptCargoServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AcceptCargoServiceImpl(
                sessionCargoRepository, cargoRepository, playerShipRepository,
                shipRepository, gameSessionRepository, portQueryService,
                portDistanceForCargoService, sessionPlayerRepository);
    }

    private GameSession buildRunningSession(UUID sessionId, int currentTick) {
        return GameSession.reconstruct(
                sessionId, SessionStatus.RUNNING, UUID.randomUUID(), 4,
                currentTick, 5, 100, "AABBCC",
                new ArrayList<>(), new HashMap<>(),
                LocalDateTime.now(), Duration.ofMinutes(30)
        );
    }

    private SessionCargo buildAvailableSessionCargo(UUID sessionId, int spawnTick) {
        return SessionCargo.create(
                UUID.randomUUID(), sessionId,
                UUID.randomUUID(), UUID.randomUUID(),
                BigDecimal.valueOf(1000), false,
                50, CargoType.GENERAL_GOODS, 0.1,
                spawnTick, 100, false
        );
    }

    private Ship buildShip(int maxCargoCapacity, double maxSpeed) {
        return Ship.reconstruct(
                UUID.randomUUID(), "Cargo King", "A ship",
                ShipClass.STANDARD, BigDecimal.valueOf(50000),
                maxCargoCapacity, maxSpeed,
                10.0, BigDecimal.valueOf(1000),
                BigDecimal.valueOf(500), 0.9, "icon.png", 5
        );
    }

    private PlayerShip buildPlayerShip(UUID playerId, UUID sessionId, UUID shipId) {
        return PlayerShip.reconstruct(
                UUID.randomUUID(), shipId, playerId, sessionId,
                ShipStatus.AT_PORT, 100.0, 100.0,
                UUID.randomUUID(), null, -1, -1, -1, -1, 0.0, 0.0
        );
    }

    private AcceptCargoRequest buildRequest(UUID sessionCargoId, UUID playerShipId) {
        AcceptCargoRequest req = new AcceptCargoRequest();
        req.setSessionCargoId(sessionCargoId);
        req.setPlayerShipId(playerShipId);
        return req;
    }

    private void mockSessionPlayer(UUID playerId, UUID sessionId) {
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId))
                .thenReturn(Optional.of(new at.fhv.backend.domain.model.player.BaseSessionPlayer(playerId, sessionId, "TestPlayer", false)));
    }

    @Test
    void givenUnknownSessionId_whenAcceptCargo_thenThrowsSessionNotFoundException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId,
                buildRequest(UUID.randomUUID(), UUID.randomUUID())))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenUnknownSessionCargoId_whenAcceptCargo_thenThrowsCargoNotFoundException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        UUID cargoId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargoId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId, buildRequest(cargoId, UUID.randomUUID())))
                .isInstanceOf(CargoNotFoundException.class);
    }

    @Test
    void givenInactiveCargo_whenAcceptCargo_thenThrowsCargoNotAvailableException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 5);

        SessionCargo cargo = SessionCargo.create(
                UUID.randomUUID(), sessionId, UUID.randomUUID(), UUID.randomUUID(),
                BigDecimal.valueOf(500), false, 30, CargoType.FOOD, 0.1, 10, 100, false);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), UUID.randomUUID())))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenAvailableCargoButNotYetVisible_whenAcceptCargo_thenThrowsCargoNotAvailableException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 3);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 5);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), UUID.randomUUID())))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenPlayerShipNotFound_whenAcceptCargo_thenThrowsShipNotFoundException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        UUID shipId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(shipId, playerId, sessionId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), shipId)))
                .isInstanceOf(ShipNotFoundException.class);
    }

    @Test
    void givenShipCapacityTooSmall_whenAcceptCargo_thenThrowsCargoCapacityExceededException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship smallShip = buildShip(30, 10.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, smallShip.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(smallShip));

        assertThatThrownBy(() -> service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId())))
                .isInstanceOf(CargoCapacityExceededException.class);
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenStatusInReturnedDTOIsAssigned() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship ship = buildShip(100, 15.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(ship));
        when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(100.0);
        when(sessionCargoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));
        mockSessionPlayer(playerId, sessionId);

        SessionCargoDTO dto = service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId()));

        assertThat(dto.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenSaveIsCalledOnRepository() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship ship = buildShip(100, 15.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(ship));
        when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(50.0);
        when(sessionCargoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));
        mockSessionPlayer(playerId, sessionId);

        service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId()));

        verify(sessionCargoRepository, times(1)).save(any(SessionCargo.class));
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenReturnedDTOHasCorrectSessionId() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship ship = buildShip(100, 15.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(ship));
        when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(50.0);
        when(sessionCargoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));
        mockSessionPlayer(playerId, sessionId);

        SessionCargoDTO dto = service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId()));

        assertThat(dto.getSessionId()).isEqualTo(sessionId);
    }

    @Test
    void givenValidRequestAndDistanceServiceFails_whenAcceptCargo_thenFallbackExpiryIsUsed() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship ship = buildShip(100, 15.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId))
                .thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(ship));
        when(portDistanceForCargoService.distanceBetween(any(), any()))
                .thenThrow(new RuntimeException("Port not found"));
        when(sessionCargoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));
        mockSessionPlayer(playerId, sessionId);

        SessionCargoDTO dto = service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId()));

        assertThat(dto.getExpiresAtTick()).isEqualTo(100);
        assertThat(dto.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenPortQueryServiceWorks_whenAcceptCargo_thenPortNamesAreEnriched() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId, 0);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, 0);
        Ship ship = buildShip(100, 15.0);
        PlayerShip playerShip = buildPlayerShip(playerId, sessionId, ship.getId());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findByIdForUpdate(cargo.getId())).thenReturn(Optional.of(cargo));
        when(playerShipRepository.findByIdAndPlayerIdAndSessionId(playerShip.getId(), playerId, sessionId)).thenReturn(Optional.of(playerShip));
        when(shipRepository.findById(playerShip.getShipId())).thenReturn(Optional.of(ship));
        when(portDistanceForCargoService.distanceBetween(any(), any())).thenReturn(60.0);
        when(sessionCargoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(playerShipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portQueryService.findById(cargo.getOriginPortId())).thenReturn(new at.fhv.backend.rest.dtos.port.PortResponseDTO(cargo.getOriginPortId(), "Lissabon", 1, 2));
        when(portQueryService.findById(cargo.getDestinationPortId())).thenReturn(new at.fhv.backend.rest.dtos.port.PortResponseDTO(cargo.getDestinationPortId(), "Genua", 3, 4));
        mockSessionPlayer(playerId, sessionId);

        SessionCargoDTO dto = service.acceptCargo(playerId, sessionId, buildRequest(cargo.getId(), playerShip.getId()));

        assertThat(dto.getOriginPortName()).isEqualTo("Lissabon");
        assertThat(dto.getDestinationPortName()).isEqualTo("Genua");
    }
}
