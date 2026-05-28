package at.fhv.backend.application.services.impl.pilotstrike;

import at.fhv.backend.application.config.PilotStrikePortConfig;
import at.fhv.backend.application.services.pilotstrike.PilotStrikeRandomProvider;
import at.fhv.backend.application.services.pilotstrike.PilotStrikeService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.pilotstrike.PilotStrike;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.websocket.PilotStrikeEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PilotStrikeServiceImpl implements PilotStrikeService {

    static final BigDecimal PILOTAGE_REFUND = new BigDecimal("600");

    private final PortQueryService portQueryService;
    private final TravelRepository travelRepository;
    private final GameSessionWebSocketController webSocketController;
    private final PilotStrikePortConfig portConfig;
    private final PilotStrikeRandomProvider randomProvider;

    private final Map<UUID, Map<UUID, PilotStrike>> activeStrikesBySession = new ConcurrentHashMap<>();
    private final Map<UUID, Integer> cooldownUntilTickBySession = new ConcurrentHashMap<>();

    public PilotStrikeServiceImpl(PortQueryService portQueryService,
                                  TravelRepository travelRepository,
                                  GameSessionWebSocketController webSocketController,
                                  PilotStrikePortConfig portConfig,
                                  PilotStrikeRandomProvider randomProvider) {
        this.portQueryService = portQueryService;
        this.travelRepository = travelRepository;
        this.webSocketController = webSocketController;
        this.portConfig = portConfig;
        this.randomProvider = randomProvider;
    }

    /**
     * Original method — loads ports and travels from DB itself.
     * Still works for any caller outside the tick loop.
     */
    @Override
    @Transactional
    public void processTick(UUID sessionId, int currentTick) {
        processTick(sessionId, currentTick,
                portQueryService.findAll(),
                travelRepository.findAllInProgressBySessionId(sessionId));
    }

    /**
     * Optimized overload — accepts pre-loaded data from TickContext
     * to avoid redundant DB queries during tick processing.
     */
    @Override
    @Transactional
    public void processTick(UUID sessionId, int currentTick,
                            List<PortResponseDTO> allPorts, List<Travel> activeTravels) {
        Map<UUID, PilotStrike> strikes = activeStrikesBySession.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>());
        PilotStrikePortConfig.StrikeSettings settings = portConfig.getSettings();

        List<UUID> expired = new ArrayList<>();
        for (Map.Entry<UUID, PilotStrike> entry : strikes.entrySet()) {
            if (currentTick >= entry.getValue().endTick()) {
                expired.add(entry.getKey());
                webSocketController.broadcastPilotStrike(
                        sessionId.toString(),
                        PilotStrikeEvent.ended(entry.getValue().portId(), entry.getValue().portName())
                );
            }
        }
        for (UUID portId : expired) {
            strikes.remove(portId);
        }
        if (!expired.isEmpty()) {
            cooldownUntilTickBySession.put(sessionId, currentTick + settings.cooldownTicks());
        }

        if (strikes.size() >= settings.maxActiveStrikes()) {
            return;
        }
        if (currentTick < cooldownUntilTickBySession.getOrDefault(sessionId, 0)) {
            return;
        }
        if (randomProvider.nextStartRoll() >= settings.startChancePerTick()) {
            return;
        }

        // Use pre-loaded ports instead of querying DB
        List<PortResponseDTO> candidates = allPorts.stream()
                .filter(port -> portConfig.isStrikeEligible(port.name()))
                .filter(port -> !strikes.containsKey(port.id()))
                .toList();
        if (candidates.isEmpty()) {
            return;
        }

        PortResponseDTO port = candidates.get(randomProvider.nextPortIndex(candidates.size()));
        int span = settings.maxDurationTicks() - settings.minDurationTicks() + 1;
        int duration = settings.minDurationTicks() + randomProvider.nextDurationOffset(Math.max(1, span));
        int endTick = currentTick + duration;

        PilotStrike strike = new PilotStrike(port.id(), port.name(), currentTick, endTick);
        strikes.put(port.id(), strike);

        // Use pre-loaded travels instead of querying DB
        List<PilotStrikeEvent.RevokedTravel> revoked = revokePilotageForDestinationTravels(activeTravels, portId(port));

        webSocketController.broadcastPilotStrike(
                sessionId.toString(),
                PilotStrikeEvent.started(port.id(), port.name(), endTick, revoked)
        );
    }

    private static UUID portId(PortResponseDTO port) {
        return port.id();
    }

    @Override
    public boolean isStrikeActive(UUID sessionId, UUID portId) {
        Map<UUID, PilotStrike> strikes = activeStrikesBySession.get(sessionId);
        return strikes != null && strikes.containsKey(portId);
    }

    @Override
    public List<PilotStrike> getActiveStrikes(UUID sessionId) {
        Map<UUID, PilotStrike> strikes = activeStrikesBySession.get(sessionId);
        if (strikes == null || strikes.isEmpty()) {
            return List.of();
        }
        return List.copyOf(strikes.values());
    }

    void seedStrike(UUID sessionId, PilotStrike strike) {
        activeStrikesBySession
                .computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>())
                .put(strike.portId(), strike);
    }

    /**
     * Uses pre-loaded travel list instead of querying DB.
     */
    private List<PilotStrikeEvent.RevokedTravel> revokePilotageForDestinationTravels(
            List<Travel> activeTravels, UUID portId) {
        List<PilotStrikeEvent.RevokedTravel> revoked = new ArrayList<>();
        for (Travel travel : activeTravels) {
            if (!travel.getDestinationPortId().equals(portId)) {
                continue;
            }
            if (!travel.isPilotageServiceBooked() || travel.isPilotageStrikeRevoked()) {
                continue;
            }
            travel.revokePilotageDueToStrike(PILOTAGE_REFUND);
            travelRepository.save(travel);
            revoked.add(new PilotStrikeEvent.RevokedTravel(travel.getTravelId(), travel.getPlayerId()));
        }
        return revoked;
    }
}