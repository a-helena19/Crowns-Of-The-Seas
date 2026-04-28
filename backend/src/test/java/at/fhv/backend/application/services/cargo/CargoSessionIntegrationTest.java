package at.fhv.backend.application.services.cargo;


import at.fhv.backend.application.services.cargo.AcceptCargoService;
import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.config.TestDatasourceConfig;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.*;
import at.fhv.backend.infrastructure.persistence.ship.ShipJpaRepository;
import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Import(TestDatasourceConfig.class)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
@Transactional
class CargoSessionIntegrationTest {

    @Autowired
    private GameSessionService gameSessionService;

    @Autowired
    private CargoQueryService cargoQueryService;

    @Autowired
    private AcceptCargoService acceptCargoService;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private SessionCargoRepository sessionCargoRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private ShipRepository shipRepository;

    @Autowired
    private PlayerShipRepository playerShipRepository;

    @Autowired
    private ShipJpaRepository shipJpaRepository;

    private SessionDTO createAndStartSession(UUID hostId) {
        SessionDTO created = gameSessionService.createSession(
                hostId, "Host", 4, 5, 100, Duration.ofMinutes(30));
        return gameSessionService.startGame(created.id(), hostId);
    }

    private Cargo persistCargo(String name, int capacity) {
        return cargoRepository.save(Cargo.create(
                name, "Beschreibung von " + name,
                BigDecimal.valueOf(500), capacity,
                CargoType.GENERAL_GOODS, 0.1));
    }

    private SessionCargo persistAvailableSessionCargo(UUID sessionId, UUID cargoId,
                                                      UUID originPortId, UUID destPortId,
                                                      int capacity) {
        SessionCargo sc = SessionCargo.create(
                cargoId, sessionId, originPortId, destPortId,
                BigDecimal.valueOf(800), false, capacity,
                CargoType.GENERAL_GOODS, 0.1, 0, 200);
        sc.activate();
        return sessionCargoRepository.save(sc);
    }


    private Ship persistShip(int maxCargoCapacity, double maxSpeed) {
        at.fhv.backend.infrastructure.persistence.ship.ShipEntity entity =
                new at.fhv.backend.infrastructure.persistence.ship.ShipEntity();
        entity.setName("Test-Schiff");
        entity.setDescription("Ein schnelles Schiff");
        entity.setShipClass(ShipClass.STANDARD);
        entity.setPrice(BigDecimal.valueOf(30000));
        entity.setMaxCargoCapacity(maxCargoCapacity);
        entity.setMaxSpeed(maxSpeed);
        entity.setFuelConsumption(8.0);
        entity.setMaxFuel(BigDecimal.valueOf(500));
        entity.setOperatingCost(BigDecimal.valueOf(200));
        entity.setBaseReliability(0.95);
        entity.setIconUrl("icon.png");
        entity.setStock(10);
        entity = shipJpaRepository.save(entity);

        return Ship.reconstruct(entity.getId(), entity.getName(), entity.getDescription(),
                entity.getShipClass(), entity.getPrice(), entity.getMaxCargoCapacity(),
                entity.getMaxSpeed(), entity.getFuelConsumption(), entity.getMaxFuel(),
                entity.getOperatingCost(), entity.getBaseReliability(), entity.getIconUrl(),
                entity.getStock());
    }

    private PlayerShip persistPlayerShip(UUID playerId, UUID sessionId, UUID shipId, UUID portId) {
        PlayerShip ps = PlayerShip.reconstruct(
                UUID.randomUUID(), shipId, playerId, sessionId,
                ShipStatus.AT_PORT, 100.0, 100.0, portId, null, -1);
        return playerShipRepository.save(ps);
    }

    private AcceptCargoRequest buildRequest(UUID sessionCargoId, UUID playerShipId) {
        AcceptCargoRequest req = new AcceptCargoRequest();
        req.setSessionCargoId(sessionCargoId);
        req.setPlayerShipId(playerShipId);
        return req;
    }

    @Test
    void givenRunningSessionAndAvailableCargo_whenGetAvailableCargosBySession_thenReturnsOne() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Holz", 50);
        UUID portId = UUID.randomUUID();
        persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        List<SessionCargoDTO> result = cargoQueryService.getAvailableCargosBySession(sessionId);

        assertThat(result).hasSize(1);
    }

    @Test
    void givenRunningSessionWithNoCargos_whenGetAvailableCargosBySession_thenReturnsEmpty() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);

        List<SessionCargoDTO> result = cargoQueryService.getAvailableCargosBySession(session.id());

        assertThat(result).isEmpty();
    }

    @Test
    void givenMultipleCargosSameSession_whenGetAvailableCargosBySession_thenReturnsAll() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo t1 = persistCargo("Holz", 50);
        Cargo t2 = persistCargo("Eisen", 80);
        UUID port = UUID.randomUUID();
        persistAvailableSessionCargo(sessionId, t1.getId(), port, UUID.randomUUID(), 50);
        persistAvailableSessionCargo(sessionId, t2.getId(), port, UUID.randomUUID(), 80);

        List<SessionCargoDTO> result = cargoQueryService.getAvailableCargosBySession(sessionId);

        assertThat(result).hasSize(2);
    }

    @Test
    void givenUnknownSessionId_whenGetAvailableCargosBySession_thenThrowsSessionNotFoundException() {
        UUID unknownId = UUID.randomUUID();

        assertThatThrownBy(() -> cargoQueryService.getAvailableCargosBySession(unknownId))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenCargoAtDifferentPort_whenGetAvailableCargosByPort_thenReturnsOnlyMatchingPort() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        UUID portA = UUID.randomUUID();
        UUID portB = UUID.randomUUID();
        Cargo t1 = persistCargo("Holz", 50);
        Cargo t2 = persistCargo("Stahl", 70);
        persistAvailableSessionCargo(sessionId, t1.getId(), portA, UUID.randomUUID(), 50);
        persistAvailableSessionCargo(sessionId, t2.getId(), portB, UUID.randomUUID(), 70);

        List<SessionCargoDTO> result = cargoQueryService.getAvailableCargos(sessionId, portA);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOriginPortId()).isEqualTo(portA);
    }

    @Test
    void givenNoCargoAtPort_whenGetAvailableCargosByPort_thenReturnsEmpty() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo t1 = persistCargo("Holz", 50);
        UUID portA = UUID.randomUUID();
        UUID portB = UUID.randomUUID();
        persistAvailableSessionCargo(sessionId, t1.getId(), portA, UUID.randomUUID(), 50);

        List<SessionCargoDTO> result = cargoQueryService.getAvailableCargos(sessionId, portB);

        assertThat(result).isEmpty();
    }

    @Test
    void givenPersistedCargo_whenGetCargoById_thenReturnsCorrectDTO() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Weizen", 60);
        SessionCargo sc = persistAvailableSessionCargo(
                sessionId, template.getId(), UUID.randomUUID(), UUID.randomUUID(), 60);

        SessionCargoDTO dto = cargoQueryService.getCargoById(sc.getId());

        assertThat(dto.getId()).isEqualTo(sc.getId());
        assertThat(dto.getCargoStatus()).isEqualTo(CargoStatus.AVAILABLE);
        assertThat(dto.getCapacity()).isEqualTo(60);
    }

    @Test
    void givenUnknownCargoId_whenGetCargoById_thenThrowsCargoNotFoundException() {
        assertThatThrownBy(() -> cargoQueryService.getCargoById(UUID.randomUUID()))
                .isInstanceOf(CargoNotFoundException.class);
    }

    @Test
    void givenUnknownSessionId_whenAcceptCargo_thenThrowsSessionNotFoundException() {
        UUID unknownSessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();

        assertThatThrownBy(() -> acceptCargoService.acceptCargo(
                playerId, unknownSessionId,
                buildRequest(UUID.randomUUID(), UUID.randomUUID())))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenUnknownCargoId_whenAcceptCargo_thenThrowsCargoNotFoundException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);

        assertThatThrownBy(() -> acceptCargoService.acceptCargo(
                hostId, session.id(),
                buildRequest(UUID.randomUUID(), UUID.randomUUID())))
                .isInstanceOf(CargoNotFoundException.class);
    }

    @Test
    void givenPlayerShipNotBelongingToPlayer_whenAcceptCargo_thenThrowsShipNotFoundException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Holz", 50);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        UUID wrongPlayer = UUID.randomUUID();
        Ship ship = persistShip(100, 10.0);
        PlayerShip wrongShip = persistPlayerShip(wrongPlayer, sessionId, ship.getId(), portId);

        assertThatThrownBy(() -> acceptCargoService.acceptCargo(
                hostId, sessionId,
                buildRequest(sc.getId(), wrongShip.getId())))
                .isInstanceOf(ShipNotFoundException.class);
    }

    @Test
    void givenShipWithTooSmallCapacity_whenAcceptCargo_thenThrowsCargoCapacityExceededException() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Stahl", 100);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 100);

        Ship tinyShip = persistShip(30, 10.0); // capacity=30, cargo benötigt 100
        PlayerShip playerShip = persistPlayerShip(hostId, sessionId, tinyShip.getId(), portId);

        assertThatThrownBy(() -> acceptCargoService.acceptCargo(
                hostId, sessionId,
                buildRequest(sc.getId(), playerShip.getId())))
                .isInstanceOf(at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException.class);
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenCargoStatusIsAssigned() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Kaffee", 50);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        Ship ship = persistShip(100, 12.0);
        PlayerShip playerShip = persistPlayerShip(hostId, sessionId, ship.getId(), portId);

        SessionCargoDTO dto = acceptCargoService.acceptCargo(
                hostId, sessionId,
                buildRequest(sc.getId(), playerShip.getId()));

        assertThat(dto.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenCargoIsPersisted() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Kaffee", 50);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        Ship ship = persistShip(100, 12.0);
        PlayerShip playerShip = persistPlayerShip(hostId, sessionId, ship.getId(), portId);

        acceptCargoService.acceptCargo(
                hostId, sessionId,
                buildRequest(sc.getId(), playerShip.getId()));

        SessionCargoDTO persisted = cargoQueryService.getCargoById(sc.getId());
        assertThat(persisted.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenAlreadyAssignedCargo_whenAcceptCargoAgain_thenThrowsCargoNotAvailableException() {
        UUID hostId = UUID.randomUUID();
        UUID player2Id = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Tee", 50);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        Ship ship1 = persistShip(100, 12.0);
        Ship ship2 = persistShip(100, 12.0);
        PlayerShip ps1 = persistPlayerShip(hostId, sessionId, ship1.getId(), portId);
        PlayerShip ps2 = persistPlayerShip(player2Id, sessionId, ship2.getId(), portId);

        acceptCargoService.acceptCargo(hostId, sessionId, buildRequest(sc.getId(), ps1.getId()));

        assertThatThrownBy(() -> acceptCargoService.acceptCargo(
                player2Id, sessionId,
                buildRequest(sc.getId(), ps2.getId())))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenValidRequest_whenAcceptCargo_thenExpiresAtTickIsPositive() {
        UUID hostId = UUID.randomUUID();
        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Salz", 50);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(sessionId, template.getId(), portId, UUID.randomUUID(), 50);

        Ship ship = persistShip(100, 10.0);
        PlayerShip playerShip = persistPlayerShip(hostId, sessionId, ship.getId(), portId);

        SessionCargoDTO dto = acceptCargoService.acceptCargo(
                hostId, sessionId,
                buildRequest(sc.getId(), playerShip.getId()));

        assertThat(dto.getExpiresAtTick()).isGreaterThan(0);
    }

    @Test
    void givenFullFlow_whenSessionStartsAndCargoIsAccepted_thenCargoIsNoLongerAvailable() {
        UUID hostId = UUID.randomUUID();

        SessionDTO session = createAndStartSession(hostId);
        UUID sessionId = session.id();

        Cargo template = persistCargo("Zucker", 40);
        UUID portId = UUID.randomUUID();
        SessionCargo sc = persistAvailableSessionCargo(
                sessionId, template.getId(), portId, UUID.randomUUID(), 40);

        List<SessionCargoDTO> before = cargoQueryService.getAvailableCargos(sessionId, portId);
        assertThat(before).hasSize(1);

        Ship ship = persistShip(100, 12.0);
        PlayerShip playerShip = persistPlayerShip(hostId, sessionId, ship.getId(), portId);
        acceptCargoService.acceptCargo(hostId, sessionId, buildRequest(sc.getId(), playerShip.getId()));

        List<SessionCargoDTO> after = cargoQueryService.getAvailableCargos(sessionId, portId);
        assertThat(after).isEmpty();
    }
}
