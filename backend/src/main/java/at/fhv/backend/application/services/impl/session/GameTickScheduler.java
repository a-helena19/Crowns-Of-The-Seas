package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.port.application.PortQueryService;
import at.fhv.backend.port.application.dto.PortResponseDTO;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.ShipPositionsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.TickUpdateEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class GameTickScheduler {

    private final GameSessionRepository gameSessionRepository;
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final PortQueryService portQueryService;
    private final GameSessionWebSocketController webSocketController;

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);
    private final Map<UUID, ScheduledFuture<?>> runningTasks = new ConcurrentHashMap<>();

    public GameTickScheduler(GameSessionRepository gameSessionRepository,
                             TravelRepository travelRepository,
                             PlayerShipRepository playerShipRepository,
                             ShipRepository shipRepository,
                             PortQueryService portQueryService,
                             GameSessionWebSocketController webSocketController) {
        this.gameSessionRepository = gameSessionRepository;
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.portQueryService = portQueryService;
        this.webSocketController = webSocketController;
    }

    public void startForSession(UUID sessionId, int tickRateSeconds) {
        if (runningTasks.containsKey(sessionId)) return;

        ScheduledFuture<?> task = executor.scheduleAtFixedRate(
                () -> processTick(sessionId),
                tickRateSeconds,
                tickRateSeconds,
                TimeUnit.SECONDS
        );
        runningTasks.put(sessionId, task);
    }

    public void stopForSession(UUID sessionId) {
        ScheduledFuture<?> task = runningTasks.remove(sessionId);
        if (task != null) task.cancel(false);
    }

    @Transactional
    public void processTick(UUID sessionId) {
        try {
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                stopForSession(sessionId);
                return;
            }

            session.tick();
            int currentTick = session.getCurrentTick();

            if (session.isExpired()) {
                session.finish();
                gameSessionRepository.save(session);
                webSocketController.broadcastTickUpdate(
                        sessionId.toString(),
                        new TickUpdateEvent(currentTick, session.getTotalTicks())
                );
                stopForSession(sessionId);
                return;
            }

            gameSessionRepository.save(session);

            // Tick zuerst broadcasten — damit die Zeit immer aktualisiert wird
            webSocketController.broadcastTickUpdate(
                    sessionId.toString(),
                    new TickUpdateEvent(currentTick, session.getTotalTicks())
            );

        } catch (Exception e) {
            System.err.println("Tick error for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            return;
        }

        // Ankunft und Schiffspositionen separat — Fehler hier blockieren den Tick nicht
        try {
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session == null) return;
            int currentTick = session.getCurrentTick();

            List<Travel> activeTravels = travelRepository.findAllInProgressBySessionId(sessionId);
            for (Travel travel : activeTravels) {
                if (currentTick >= travel.getArrivalTick()) {
                    handleArrival(travel);
                }
            }

            broadcastShipPositions(sessionId, currentTick, session);
        } catch (Exception e) {
            System.err.println("Ship update error for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void handleArrival(Travel travel) {
        travel.markAsArrived(0.0, travel.getTravelStatus());
        travelRepository.save(travel);

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship != null) {
            ship.arriveAtPort(travel.getDestinationPortId());
            playerShipRepository.save(ship);
        }
    }

    public void triggerImmediateBroadcast(UUID sessionId) {
        try {
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session == null) return;
            broadcastShipPositions(sessionId, session.getCurrentTick(), session);
        } catch (Exception e) {
            System.err.println("Immediate broadcast error: " + e.getMessage());
        }
    }

    private void broadcastShipPositions(UUID sessionId, int currentTick, GameSession session) {
        List<PortResponseDTO> allPorts = portQueryService.findAll();
        Map<UUID, PortResponseDTO> portMap = allPorts.stream()
                .collect(Collectors.toMap(PortResponseDTO::id, p -> p));

        List<Travel> activeTravels = travelRepository.findAllInProgressBySessionId(sessionId);
        Map<UUID, Travel> travelByShipId = activeTravels.stream()
                .collect(Collectors.toMap(Travel::getPlayerShipId, t -> t));

        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);

        System.out.println("[ShipBroadcast] tick=" + currentTick
                + " ships=" + allShips.size()
                + " activeTravels=" + activeTravels.size()
                + " ports=" + portMap.size());

        List<ShipPositionsUpdateEvent.ShipPosition> positions = new ArrayList<>();

        for (PlayerShip playerShip : allShips) {
            if (playerShip.getStatus() == ShipStatus.IN_REGISTRATION) continue;

            Ship shipTemplate = shipRepository.findById(playerShip.getShipId()).orElse(null);
            String iconUrl = shipTemplate != null ? shipTemplate.getIconUrl() : "/ship.png";

            String playerName = session.getPlayers().stream()
                    .filter(p -> p.getUserId().equals(playerShip.getPlayerId()))
                    .findFirst()
                    .map(p -> p.getPlayerName())
                    .orElse("Spieler");

            Travel travel = travelByShipId.get(playerShip.getId());

            if (travel != null) {
                // Schiff ist unterwegs — Position interpolieren
                PortResponseDTO origin = portMap.get(travel.getOriginPortId());
                PortResponseDTO dest = portMap.get(travel.getDestinationPortId());

                System.out.println("[ShipBroadcast] EN_ROUTE ship=" + playerShip.getId()
                        + " originPort=" + travel.getOriginPortId() + " found=" + (origin != null)
                        + " destPort=" + travel.getDestinationPortId() + " found=" + (dest != null));

                if (origin != null && dest != null) {
                    double progress = travel.getProgress(currentTick);
                    double x = origin.x() + (dest.x() - origin.x()) * progress;
                    double y = origin.y() + (dest.y() - origin.y()) * progress;

                    positions.add(new ShipPositionsUpdateEvent.ShipPosition(
                            playerShip.getId(), playerShip.getPlayerId(), playerName,
                            iconUrl, x, y, "EN_ROUTE", travel.getArrivalTick(),
                            origin.x(), origin.y(), dest.x(), dest.y(), travel.getStartTick()
                    ));
                }
            } else if (playerShip.getCurrentPortId() != null) {
                // Schiff ist im Hafen
                PortResponseDTO port = portMap.get(playerShip.getCurrentPortId());
                if (port != null) {
                    positions.add(new ShipPositionsUpdateEvent.ShipPosition(
                            playerShip.getId(), playerShip.getPlayerId(), playerName,
                            iconUrl, port.x(), port.y(), "AT_PORT", null,
                            null, null, null, null, null
                    ));
                }
            }
        }

        System.out.println("[ShipBroadcast] broadcasting " + positions.size() + " positions");

        if (!positions.isEmpty()) {
            webSocketController.broadcastShipPositions(
                    sessionId.toString(),
                    new ShipPositionsUpdateEvent(positions)
            );
        }
    }
}
