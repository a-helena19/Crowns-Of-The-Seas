package at.fhv.backend.application.services.cargo;


import at.fhv.backend.application.services.impl.cargo.CargoQueryServiceImpl;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CargoQueryServiceImplTest {

    @Mock
    private SessionCargoRepository sessionCargoRepository;

    @Mock
    private CargoRepository cargoRepository;

    @Mock
    private GameSessionRepository gameSessionRepository;

    @Mock
    private PortQueryService portQueryService;

    @Mock
    private SessionPlayerRepository sessionPlayerRepository;

    private CargoQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CargoQueryServiceImpl(
                sessionCargoRepository, cargoRepository, gameSessionRepository, portQueryService, sessionPlayerRepository);
    }

    private GameSession buildRunningSession(UUID sessionId) {
        UUID hostId = UUID.randomUUID();
        GameSession session = new GameSession(hostId, 4, 5, 100, Duration.ofMinutes(30));
        // Via reconstruct um currentTick auf 5 zu setzen
        return GameSession.reconstruct(
                sessionId,
                at.fhv.backend.domain.model.session.SessionStatus.RUNNING,
                hostId, 4, 5, 5, 100, "ABCDEF",
                new java.util.ArrayList<>(),
                new java.util.HashMap<>(),
                new java.util.HashMap<>(),
                java.time.LocalDateTime.now(),
                Duration.ofMinutes(30)
        );
    }

    private SessionCargo buildAvailableSessionCargo(UUID sessionId, UUID originPortId, UUID destPortId) {
        return SessionCargo.create(
                UUID.randomUUID(), sessionId, originPortId, destPortId,
                BigDecimal.valueOf(800), false, 40,
                CargoType.FOOD, 0.2, 0, 100, false);
    }

    @Test
    void givenUnknownSessionId_whenGetAvailableCargos_thenThrowsSessionNotFoundException() {
        UUID sessionId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAvailableCargos(sessionId, UUID.randomUUID(), playerId))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenSessionWithNoCargos_whenGetAvailableCargos_thenReturnsEmptyList() {
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        when(sessionCargoRepository.findAvailableBySessionIdAndPort(sessionId, portId, session.getCurrentTick()))
                .thenReturn(List.of());

        List<SessionCargoDTO> result = service.getAvailableCargos(sessionId, portId, playerId);

        assertThat(result).isEmpty();
    }

    @Test
    void givenSessionWithOneCargo_whenGetAvailableCargos_thenReturnsOneDTO() {
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, portId, UUID.randomUUID());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        when(sessionCargoRepository.findAvailableBySessionIdAndPort(sessionId, portId, session.getCurrentTick()))
                .thenReturn(List.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));

        List<SessionCargoDTO> result = service.getAvailableCargos(sessionId, portId, playerId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(cargo.getId());
    }

    @Test
    void givenSessionWithCargo_whenGetAvailableCargos_thenDTOHasCorrectStatus() {
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, portId, UUID.randomUUID());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        when(sessionCargoRepository.findAvailableBySessionIdAndPort(sessionId, portId, session.getCurrentTick()))
                .thenReturn(List.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));

        List<SessionCargoDTO> result = service.getAvailableCargos(sessionId, portId, playerId);

        assertThat(result.get(0).getCargoStatus()).isEqualTo(CargoStatus.AVAILABLE);
    }

    @Test
    void givenPortQueryServiceResponds_whenGetAvailableCargos_thenPortNamesAreEnriched() {
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        UUID destPortId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, portId, destPortId);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        when(sessionCargoRepository.findAvailableBySessionIdAndPort(sessionId, portId, session.getCurrentTick()))
                .thenReturn(List.of(cargo));
        when(portQueryService.findById(portId))
                .thenReturn(new PortResponseDTO(portId, "Hamburg", 1.0, 2.0));
        when(portQueryService.findById(destPortId))
                .thenReturn(new PortResponseDTO(destPortId, "Rotterdam", 3.0, 4.0));

        List<SessionCargoDTO> result = service.getAvailableCargos(sessionId, portId, playerId);

        assertThat(result.get(0).getOriginPortName()).isEqualTo("Hamburg");
        assertThat(result.get(0).getDestinationPortName()).isEqualTo("Rotterdam");
    }

    @Test
    void givenPortQueryServiceFails_whenGetAvailableCargos_thenPortNamesAreFallback() {
        UUID sessionId = UUID.randomUUID();
        UUID portId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, portId, UUID.randomUUID());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)).thenReturn(Optional.empty());
        when(sessionCargoRepository.findAvailableBySessionIdAndPort(sessionId, portId, session.getCurrentTick()))
                .thenReturn(List.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("DB down"));

        List<SessionCargoDTO> result = service.getAvailableCargos(sessionId, portId, playerId);

        assertThat(result.get(0).getOriginPortName()).isEqualTo("Unknown");
        assertThat(result.get(0).getDestinationPortName()).isEqualTo("Unknown");
    }

    @Test
    void givenUnknownSessionId_whenGetAvailableCargosBySession_thenThrowsSessionNotFoundException() {
        UUID sessionId = UUID.randomUUID();
        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAvailableCargosBySession(sessionId))
                .isInstanceOf(SessionNotFoundException.class);
    }

    @Test
    void givenSessionWithMultipleCargos_whenGetAvailableCargosBySession_thenReturnsAll() {
        UUID sessionId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo1 = buildAvailableSessionCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());
        SessionCargo cargo2 = buildAvailableSessionCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findAvailableBySessionId(sessionId, session.getCurrentTick()))
                .thenReturn(List.of(cargo1, cargo2));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));

        List<SessionCargoDTO> result = service.getAvailableCargosBySession(sessionId);

        assertThat(result).hasSize(2);
    }

    @Test
    void givenCargoWithTemplate_whenGetAvailableCargosBySession_thenNameIsEnriched() {
        UUID sessionId = UUID.randomUUID();
        UUID cargoTemplateId = UUID.randomUUID();
        GameSession session = buildRunningSession(sessionId);
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());

        Cargo template = Cargo.reconstruct(cargoTemplateId, "Holz", "Bauholz",
                BigDecimal.valueOf(500), 40, CargoType.GENERAL_GOODS, 0.1);

        when(gameSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionCargoRepository.findAvailableBySessionId(sessionId, session.getCurrentTick()))
                .thenReturn(List.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));
        when(cargoRepository.findById(cargo.getCargoId())).thenReturn(Optional.of(template));

        List<SessionCargoDTO> result = service.getAvailableCargosBySession(sessionId);

        assertThat(result.get(0).getName()).isEqualTo("Holz");
        assertThat(result.get(0).getDescription()).isEqualTo("Bauholz");
    }

    @Test
    void givenUnknownCargoId_whenGetCargoById_thenThrowsCargoNotFoundException() {
        UUID id = UUID.randomUUID();
        when(sessionCargoRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCargoById(id))
                .isInstanceOf(CargoNotFoundException.class);
    }

    @Test
    void givenKnownCargoId_whenGetCargoById_thenReturnsDTOWithCorrectId() {
        UUID sessionId = UUID.randomUUID();
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());
        when(sessionCargoRepository.findById(cargo.getId())).thenReturn(Optional.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));

        SessionCargoDTO dto = service.getCargoById(cargo.getId());

        assertThat(dto.getId()).isEqualTo(cargo.getId());
        assertThat(dto.getSessionId()).isEqualTo(sessionId);
    }

    @Test
    void givenKnownCargoId_whenGetCargoById_thenDTOHasCargoType() {
        UUID sessionId = UUID.randomUUID();
        SessionCargo cargo = buildAvailableSessionCargo(sessionId, UUID.randomUUID(), UUID.randomUUID());
        when(sessionCargoRepository.findById(cargo.getId())).thenReturn(Optional.of(cargo));
        when(portQueryService.findById(any())).thenThrow(new RuntimeException("not found"));

        SessionCargoDTO dto = service.getCargoById(cargo.getId());

        assertThat(dto.getCargoType()).isEqualTo(CargoType.FOOD);
        assertThat(dto.getCapacity()).isEqualTo(40);
    }
}
