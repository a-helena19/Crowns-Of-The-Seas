package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.TravelResumedEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TravelPauseServiceImpl implements TravelPauseService {
    private final TravelRepository travelRepository;
    private final GameSessionRepository gameSessionRepository;
    private final GameSessionWebSocketController webSocketController;
    private final PortRepository portRepository;

    private final Set<UUID> pausedTravelIds = ConcurrentHashMap.newKeySet();
    private final Map<UUID, Integer> pausedAtTickMap = new ConcurrentHashMap<>();
    private final Map<UUID, BlockingEvent> blockingEventByTravelId = new ConcurrentHashMap<>();

    public TravelPauseServiceImpl(TravelRepository travelRepository,
                                  GameSessionRepository gameSessionRepository,
                                  GameSessionWebSocketController webSocketController,
                                  PortRepository portRepository) {
        this.travelRepository = travelRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.webSocketController = webSocketController;
        this.portRepository = portRepository;
    }

    @Override
    public void pauseTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason) {
        pauseTravel(travelId, sessionId, playerId, playerShipId, reason, null);
    }

    @Override
    public void pauseTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason, String eventId) {
        pausedTravelIds.add(travelId);
        blockingEventByTravelId.put(travelId, new BlockingEvent(reason, eventId));

        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : 0;
        pausedAtTickMap.put(travelId, currentTick);

        System.out.println("[TravelPause] Travel " + travelId
                + " PAUSED — reason: " + reason
                + " — eventId: " + eventId
                + " — player: " + playerId
                + " — tick: " + currentTick);
    }

    @Override
    @Transactional
    public void resumeTravel(UUID travelId, UUID sessionId, UUID playerId, UUID playerShipId, String reason) {
        if (!pausedTravelIds.remove(travelId)) {
            return;
        }

        Integer pausedAtTick = pausedAtTickMap.remove(travelId);
        blockingEventByTravelId.remove(travelId);

        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return;
        }

        int currentTick = session.getCurrentTick();
        int ticksPaused = pausedAtTick != null ? Math.max(0, currentTick - pausedAtTick) : 0;
        Travel travel = travelRepository.findById(travelId).orElse(null);

        if (ticksPaused > 0) {
            if (travel != null) {
                travel.shiftScheduleForPause(ticksPaused);
                travelRepository.save(travel);
                System.out.println("[TravelPause] Travel " + travelId
                        + " schedule shifted by +" + ticksPaused + " ticks");
            }
        }

        TravelResumedEvent event = buildResumeEvent(travelId, playerId, playerShipId, reason, currentTick, travel);
        webSocketController.broadcastTravelResumed(sessionId.toString(), event);

        System.out.println("[TravelPause] Travel " + travelId
                + " RESUMED — reason: " + reason
                + " — player: " + playerId
                + " — paused for " + ticksPaused + " ticks");
    }

    @Override
    public boolean isTravelPaused(UUID travelId) {
        return pausedTravelIds.contains(travelId);
    }

    @Override
    public Integer getPausedAtTick(UUID travelId) {
        return pausedAtTickMap.get(travelId);
    }

    @Override
    public Optional<BlockingEvent> getBlockingEvent(UUID travelId) {
        return Optional.ofNullable(blockingEventByTravelId.get(travelId));
    }

    private TravelResumedEvent buildResumeEvent(UUID travelId, UUID playerId, UUID playerShipId, String reason,
                                                int currentTick, Travel travel) {
        if (travel == null) {
            return new TravelResumedEvent(
                    travelId.toString(),
                    playerId.toString(),
                    playerShipId.toString(),
                    reason
            );
        }

        Port origin = portRepository.findById(PortId.of(travel.getOriginPortId())).orElse(null);
        Port destination = portRepository.findById(PortId.of(travel.getDestinationPortId())).orElse(null);
        return new TravelResumedEvent(
                travelId.toString(),
                playerId.toString(),
                playerShipId.toString(),
                reason,
                currentTick,
                travel.getStartTick(),
                travel.getArrivalTick(),
                origin != null ? origin.getCoordinates().getX() : null,
                origin != null ? origin.getCoordinates().getY() : null,
                destination != null ? destination.getCoordinates().getX() : null,
                destination != null ? destination.getCoordinates().getY() : null
        );
    }
}
