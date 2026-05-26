package at.fhv.backend.application.services.impl.pilotstrike;

import at.fhv.backend.application.config.PilotStrikePortConfig;
import at.fhv.backend.application.services.pilotstrike.PilotStrikeRandomProvider;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.pilotstrike.PilotStrike;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.websocket.PilotStrikeEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PilotStrikeServiceImplTest {

    @Mock private PortQueryService portQueryService;
    @Mock private TravelRepository travelRepository;
    @Mock private GameSessionWebSocketController webSocketController;
    @Mock private PilotStrikeRandomProvider randomProvider;

    private PilotStrikePortConfig portConfig;
    private final UUID sessionId = UUID.randomUUID();
    private final UUID portId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        portConfig = new PilotStrikePortConfig();
    }

    @Test
    void givenLowRandomRoll_whenProcessTick_thenExactlyOneStrikeStarts() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        UUID otherPortId = UUID.randomUUID();
        when(portQueryService.findAll()).thenReturn(List.of(
                new PortResponseDTO(portId, "New York", 26.1, 37.7),
                new PortResponseDTO(otherPortId, "Sydney", 82.0, 75.0)
        ));
        when(travelRepository.findAllInProgressBySessionId(sessionId)).thenReturn(List.of());
        when(randomProvider.nextStartRoll()).thenReturn(0.0);
        when(randomProvider.nextPortIndex(2)).thenReturn(1);
        when(randomProvider.nextDurationOffset(anyInt())).thenReturn(0);

        service.processTick(sessionId, 10);

        assertFalse(service.isStrikeActive(sessionId, portId));
        assertTrue(service.isStrikeActive(sessionId, otherPortId));
        assertEquals(1, service.getActiveStrikes(sessionId).size());
        verify(webSocketController, times(1)).broadcastPilotStrike(eq(sessionId.toString()), any(PilotStrikeEvent.class));
    }

    @Test
    void givenHighRandomRoll_whenProcessTick_thenNoStrikeStarts() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        when(randomProvider.nextStartRoll()).thenReturn(0.99);

        service.processTick(sessionId, 10);

        assertTrue(service.getActiveStrikes(sessionId).isEmpty());
        verifyNoInteractions(portQueryService, webSocketController);
        verify(randomProvider, never()).nextPortIndex(anyInt());
    }

    @Test
    void givenBookedPilotageTravel_whenStrikeAtDestination_thenRevokeAndRefund() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        UUID travelId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        Travel travel = Travel.reconstruct(
                travelId, UUID.randomUUID(), playerId, sessionId,
                UUID.randomUUID(), portId,
                100, 1, 0.1, BigDecimal.TEN,
                TravelStatus.IN_PROGRESS,
                Instant.now(), null, 0,
                1, 20,
                BigDecimal.ZERO, BigDecimal.ZERO,
                true, false, BigDecimal.ZERO
        );

        when(portQueryService.findAll()).thenReturn(List.of(new PortResponseDTO(portId, "New York", 26.1, 37.7)));
        when(travelRepository.findAllInProgressBySessionId(sessionId)).thenReturn(List.of(travel));
        when(randomProvider.nextStartRoll()).thenReturn(0.0);
        when(randomProvider.nextPortIndex(1)).thenReturn(0);
        when(randomProvider.nextDurationOffset(anyInt())).thenReturn(3);

        service.processTick(sessionId, 10);

        assertTrue(travel.isPilotageStrikeRevoked());
        assertEquals(PilotStrikeServiceImpl.PILOTAGE_REFUND, travel.getPilotageRefund());
        verify(travelRepository).save(travel);
    }

    @Test
    void givenActiveStrike_whenProcessTick_thenNoSecondStrikeStarts() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        service.seedStrike(sessionId, new PilotStrike(portId, "New York", 1, 20));

        service.processTick(sessionId, 10);

        assertEquals(1, service.getActiveStrikes(sessionId).size());
        verifyNoInteractions(portQueryService, randomProvider, webSocketController);
    }

    @Test
    void givenExpiredStrike_whenProcessTick_thenStrikeEndsAndCooldownPreventsImmediateNewStrike() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        service.seedStrike(sessionId, new PilotStrike(portId, "New York", 1, 5));
        assertTrue(service.isStrikeActive(sessionId, portId));

        service.processTick(sessionId, 5);

        assertFalse(service.isStrikeActive(sessionId, portId));
        verify(webSocketController).broadcastPilotStrike(eq(sessionId.toString()), any(PilotStrikeEvent.class));
        verifyNoInteractions(portQueryService, randomProvider);
    }

    @Test
    void givenCooldownActive_whenProcessTick_thenNoNewStrikeStarts() {
        PilotStrikeServiceImpl service = new PilotStrikeServiceImpl(
                portQueryService, travelRepository, webSocketController, portConfig, randomProvider);

        service.seedStrike(sessionId, new PilotStrike(portId, "New York", 1, 5));
        service.processTick(sessionId, 5);
        service.processTick(sessionId, 7);

        assertTrue(service.getActiveStrikes(sessionId).isEmpty());
        verify(webSocketController).broadcastPilotStrike(eq(sessionId.toString()), any(PilotStrikeEvent.class));
        verifyNoInteractions(portQueryService, randomProvider);
    }
}
