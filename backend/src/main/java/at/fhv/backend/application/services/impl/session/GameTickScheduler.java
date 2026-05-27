package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.application.services.minigame.StormMinigameService;
import at.fhv.backend.application.services.pilotstrike.PilotStrikeService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.application.services.travel.CustomsCheckCompletionService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.application.services.travel.TravelPauseService;
import at.fhv.backend.application.services.travel.UnloadingStartService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.rest.CargoWebSocketController;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.ShipPositionsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.TickUpdateEvent;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Service
public class GameTickScheduler {

    private final GameSessionRepository gameSessionRepository;
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final PortQueryService portQueryService;
    private final SessionCargoRepository sessionCargoRepository;
    private final CargoWebSocketController cargoWebSocketController;
    private final GameSessionWebSocketController webSocketController;
    private final TravelArrivalService travelArrivalService;
    private final CargoUnloadingPhaseService cargoUnloadingPhaseService;
    private final CargoSessionInitializer cargoSessionInitializer;
    private final TravelPauseService travelPauseService;
    private final RatMinigameService ratMinigameService;
    private final StormMinigameService stormMinigameService;
    private final CustomsService customsService;
    private final UnloadingStartService unloadingStartService;
    private final CustomsCheckCompletionService customsCheckCompletionService;
    private final PilotStrikeService pilotStrikeService;

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);
    private final Map<UUID, ScheduledFuture<?>> runningTasks = new ConcurrentHashMap<>();
    private final Map<UUID, Long> lastTickProcessedAtMs = new ConcurrentHashMap<>();
    private final Map<UUID, ReentrantLock> tickLocks = new ConcurrentHashMap<>();
    private static final int MAX_ACTIVE_CARGOS_PER_PORT = 7;

    private final Random rng = new Random();

    public GameTickScheduler(GameSessionRepository gameSessionRepository,
                             TravelRepository travelRepository,
                             PlayerShipRepository playerShipRepository,
                             ShipRepository shipRepository,
                             PortQueryService portQueryService,
                             SessionCargoRepository sessionCargoRepository,
                             CargoWebSocketController cargoWebSocketController,
                             GameSessionWebSocketController webSocketController,
                             TravelArrivalService travelArrivalService,
                             CargoUnloadingPhaseService cargoUnloadingPhaseService,
                             CargoSessionInitializer cargoSessionInitializer,
                             TravelPauseService travelPauseService,
                             RatMinigameService ratMinigameService,
                             StormMinigameService stormMinigameService,
                             PilotStrikeService pilotStrikeService,
                             CustomsService customsService,
                             UnloadingStartService unloadingStartService,
                             CustomsCheckCompletionService customsCheckCompletionService) {
        this.gameSessionRepository = gameSessionRepository;
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.portQueryService = portQueryService;
        this.sessionCargoRepository = sessionCargoRepository;
        this.cargoWebSocketController = cargoWebSocketController;
        this.webSocketController = webSocketController;
        this.travelArrivalService = travelArrivalService;
        this.cargoUnloadingPhaseService = cargoUnloadingPhaseService;
        this.cargoSessionInitializer = cargoSessionInitializer;
        this.travelPauseService = travelPauseService;
        this.ratMinigameService = ratMinigameService;
        this.stormMinigameService = stormMinigameService;
        this.pilotStrikeService = pilotStrikeService;
        this.customsService = customsService;
        this.unloadingStartService = unloadingStartService;
        this.customsCheckCompletionService = customsCheckCompletionService;
    }

    public void startForSession(UUID sessionId, int tickRateSeconds) {
        runningTasks.computeIfAbsent(sessionId, ignored ->
                executor.scheduleAtFixedRate(
                        () -> processTick(sessionId),
                        tickRateSeconds,
                        tickRateSeconds,
                        TimeUnit.SECONDS
                )
        );
    }

    public void stopForSession(UUID sessionId) {
        ScheduledFuture<?> task = runningTasks.remove(sessionId);
        if (task != null) task.cancel(false);
        lastTickProcessedAtMs.remove(sessionId);
        tickLocks.remove(sessionId);
    }

    private void checkLoadingCompletion(UUID sessionId, int currentTick) {
        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);

        for (PlayerShip ship : allShips) {
            if (ship.getStatus() == ShipStatus.LOADING
                    && ship.getLoadingCompletedAtTick() > 0
                    && currentTick >= ship.getLoadingCompletedAtTick()) {

                ship.completeLoading();
                playerShipRepository.save(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " loading completed at tick " + currentTick + " → READY_TO_DEPART");
            }
        }
    }

    private void checkRefuelingCompletion(UUID sessionId, int currentTick) {
        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);

        for (PlayerShip ship : allShips) {
            if (ship.getStatus() == ShipStatus.REFUELING
                    && ship.getRefuelingCompletedAtTick() > 0
                    && currentTick >= ship.getRefuelingCompletedAtTick()) {

                ship.completeRefueling();
                playerShipRepository.save(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " refueling completed at tick " + currentTick + " → AT_PORT");
            }
        }
    }

    private void checkRepairingCompletion(UUID sessionId, int currentTick) {
        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);

        for (PlayerShip ship : allShips) {
            if (ship.getStatus() == ShipStatus.REPAIRING
                    && ship.getRepairingCompletedAtTick() > 0
                    && currentTick >= ship.getRepairingCompletedAtTick()) {

                ship.completeRepairing();
                playerShipRepository.save(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " repairing completed at tick " + currentTick + " → AT_PORT");
            }
        }
    }

    @Transactional
    public void checkCustomsCheckCompletion(UUID sessionId, int currentTick) {
        List<Travel> arrivedTravels = travelRepository
                .findAllBySessionIdAndStatus(sessionId, TravelStatus.ARRIVED);

        for (Travel travel : arrivedTravels) {
            PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
            if (ship == null) continue;
            if (ship.getStatus() != ShipStatus.CUSTOMS_CHECK) continue;

            int completedAtTick = ship.getCustomsCheckCompletedAtTick();
            if (completedAtTick < 0) continue;
            if (currentTick < completedAtTick) continue;

            customsCheckCompletionService.completeCustomsCheck(travel.getTravelId());
        }
    }

    @Transactional
    public void checkCustomsBlockCompletion(UUID sessionId, int currentTick) {
        List<Travel> arrivedTravels = travelRepository
                .findAllBySessionIdAndStatus(sessionId, TravelStatus.ARRIVED);

        for (Travel travel : arrivedTravels) {
            PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
            if (ship == null) continue;
            if (ship.getStatus() != ShipStatus.BLOCKED) continue;

            int expirationTick = customsService.getBlockExpirationTick(travel.getTravelId());
            if (expirationTick < 0) {
                continue;
            }
            if (currentTick < expirationTick) {
                continue;
            }

            unloadingStartService.startUnloadingAfterDetention(travel.getTravelId());
            customsService.clearBlockTracking(travel.getTravelId());
            System.out.println("[GameTick] Customs block expired for travel " + travel.getTravelId()
                    + " — ship now UNLOADING");
        }
    }

    @Transactional
    public void handleUnloadingPhase(UUID sessionId, int currentTick) {
        List<Travel> arrivedTravels = travelRepository
                .findAllBySessionIdAndStatus(sessionId, TravelStatus.ARRIVED);

        for (Travel travel : arrivedTravels) {
            PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
            if (ship == null) continue;

            if (ship.getStatus() != ShipStatus.UNLOADING) continue;

            if (travel.isArrivalMiniGamePending()) continue;

            if (ship.getUnloadingCompletedAtTick() != null
                    && currentTick >= ship.getUnloadingCompletedAtTick()) {
                handleUnloadingComplete(travel, currentTick);
            }
        }
    }

    @Transactional
    public void handleUnloadingComplete(Travel travel, int currentTick) {
        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);

        if (ship == null || ship.getStatus() != ShipStatus.UNLOADING) {
            return;
        }

        List<SessionCargo> cargos = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());
        BigDecimal reward = cargoUnloadingPhaseService.completeUnloadingPhase(travel, cargos);

        System.out.println("[GameTick] Unloading complete for travel " + travel.getTravelId());
        System.out.println("[GameTick] Reward: " + reward);
    }

    @Transactional
    public void processTick(UUID sessionId) {
        ReentrantLock lock = tickLocks.computeIfAbsent(sessionId, ignored -> new ReentrantLock());
        if (!lock.tryLock()) {
            return;
        }

        try {
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                stopForSession(sessionId);
                return;
            }
            long now = System.currentTimeMillis();
            long minIntervalMs = Math.max(200L, session.getTickRateSeconds() * 1000L - 200L);
            Long lastAt = lastTickProcessedAtMs.get(sessionId);
            if (lastAt != null && (now - lastAt) < minIntervalMs) {
                return;
            }
            lastTickProcessedAtMs.put(sessionId, now);
        } catch (Exception e) {
            System.err.println("Tick pre-check error for session " + sessionId + ": " + e.getMessage());
            return;
        }

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

                SessionUpdateEvent finishedEvent = new SessionUpdateEvent(
                        session.getId(),
                        session.getGameCode(),
                        session.getStatus().toString(),
                        session.getPlayers().size(),
                        session.getMaxPlayers(),
                        session.getPlayers().stream()
                                .map(p -> new SessionUpdateEvent.PlayerInfo(
                                        p.getUserId(),
                                        p.getPlayerName(),
                                        p.isHost(),
                                        session.getPlayerFactions().get(p.getUserId()) != null
                                                ? session.getPlayerFactions().get(p.getUserId()).name()
                                                : null,
                                        session.getPlayerHomePorts().get(p.getUserId()),
                                        session.getReadyPlayers().contains(p.getUserId())))
                                .collect(Collectors.toList()),
                        "GAME_FINISHED"
                );

                webSocketController.broadcastSessionUpdate(sessionId.toString(), finishedEvent);

                stopForSession(sessionId);
                return;
            }

            gameSessionRepository.save(session);

            webSocketController.broadcastTickUpdate(
                    sessionId.toString(),
                    new TickUpdateEvent(currentTick, session.getTotalTicks())
            );

        } catch (Exception e) {
            System.err.println("Tick error for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            return;
        }

        try {
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session == null) return;
            int currentTick = session.getCurrentTick();

            checkLoadingCompletion(sessionId, currentTick);
            checkRefuelingCompletion(sessionId, currentTick);
            checkRepairingCompletion(sessionId, currentTick);
            checkCustomsCheckCompletion(sessionId, currentTick);
            checkCustomsBlockCompletion(sessionId, currentTick);
            handleUnloadingPhase(sessionId, currentTick);
            pilotStrikeService.processTick(sessionId, currentTick);

            List<Travel> activeTravels = travelRepository.findAllInProgressBySessionId(sessionId);
            for (Travel travel : activeTravels) {
                stormMinigameService.tryTriggerForTravel(travel, sessionId);
                if (travelPauseService.isTravelPaused(travel.getTravelId())) {
                    continue;
                }
                ratMinigameService.tryTriggerForTravel(travel, sessionId);

                if (travelPauseService.isTravelPaused(travel.getTravelId())) {
                    continue;
                }
                if (currentTick >= travel.getArrivalTick()) {
                    travelArrivalService.handleArrival(travel);
                }
            }

            processCargoLifecycle(sessionId, currentTick);
            broadcastShipPositions(sessionId, currentTick, session);
        } catch (Exception e) {
            System.err.println("Ship update error for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    @PreDestroy
    public void shutdown() {
        for (ScheduledFuture<?> task : runningTasks.values()) {
            task.cancel(false);
        }
        runningTasks.clear();
        lastTickProcessedAtMs.clear();
        tickLocks.clear();
        executor.shutdownNow();
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
        List<Travel> awaitingDockingTravels = travelRepository
                .findAllBySessionIdAndStatus(sessionId, TravelStatus.ARRIVED)
                .stream()
                .filter(Travel::isArrivalMiniGamePending)
                .toList();
        Map<UUID, Travel> travelByShipId = new HashMap<>(activeTravels.stream()
                .collect(Collectors.toMap(Travel::getPlayerShipId, t -> t)));
        for (Travel t : awaitingDockingTravels) {
            travelByShipId.putIfAbsent(t.getPlayerShipId(), t);
        }

        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);

        System.out.println("[ShipBroadcast] tick=" + currentTick
                + " ships=" + allShips.size()
                + " activeTravels=" + activeTravels.size()
                + " awaitingDocking=" + awaitingDockingTravels.size()
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
                PortResponseDTO origin = portMap.get(travel.getOriginPortId());
                PortResponseDTO dest = portMap.get(travel.getDestinationPortId());

                if (travel.isArrivalMiniGamePending() && dest != null) {
                    positions.add(new ShipPositionsUpdateEvent.ShipPosition(
                            playerShip.getId(), playerShip.getPlayerId(), playerName,
                            iconUrl, dest.x(), dest.y(), "AWAITING_DOCKING", null,
                            null, null, null, null, null,
                            travel.getDestinationPortId()
                    ));
                    continue;
                }

                System.out.println("[ShipBroadcast] EN_ROUTE ship=" + playerShip.getId()
                        + " originPort=" + travel.getOriginPortId() + " found=" + (origin != null)
                        + " destPort=" + travel.getDestinationPortId() + " found=" + (dest != null));

                if (origin != null && dest != null) {
                    boolean isPaused = travelPauseService.isTravelPaused(travel.getTravelId());
                    Integer pausedAtTick = travelPauseService.getPausedAtTick(travel.getTravelId());
                    int progressTick = isPaused && pausedAtTick != null ? pausedAtTick : currentTick;
                    double progress = travel.getProgress(progressTick);
                    double x = origin.x() + (dest.x() - origin.x()) * progress;
                    double y = origin.y() + (dest.y() - origin.y()) * progress;

                    positions.add(new ShipPositionsUpdateEvent.ShipPosition(
                            playerShip.getId(), playerShip.getPlayerId(), playerName,
                            iconUrl, x, y, "EN_ROUTE", travel.getArrivalTick(),
                            origin.x(), origin.y(), dest.x(), dest.y(), travel.getStartTick(), null,
                            isPaused
                    ));
                }
            } else if (playerShip.getCurrentPortId() != null) {
                PortResponseDTO port = portMap.get(playerShip.getCurrentPortId());
                if (port != null) {
                    String status = switch (playerShip.getStatus()) {
                        case LOADING         -> "LOADING";
                        case READY_TO_DEPART -> "READY_TO_DEPART";
                        case UNLOADING       -> "UNLOADING";
                        case REFUELING       -> "REFUELING";
                        case REPAIRING       -> "REPAIRING";
                        case BLOCKED         -> "BLOCKED";
                        case CUSTOMS_CHECK   -> "CUSTOMS_CHECK";
                        default              -> "AT_PORT";
                    };

                    Integer completionTick = null;
                    if (playerShip.getStatus() == ShipStatus.UNLOADING) {
                        completionTick = playerShip.getUnloadingCompletedAtTick();
                    } else if (playerShip.getStatus() == ShipStatus.LOADING) {
                        completionTick = playerShip.getLoadingCompletedAtTick();
                    } else if (playerShip.getStatus() == ShipStatus.REFUELING) {
                        completionTick = playerShip.getRefuelingCompletedAtTick();
                    } else if (playerShip.getStatus() == ShipStatus.REPAIRING) {
                        completionTick = playerShip.getRepairingCompletedAtTick();
                    } else if (playerShip.getStatus() == ShipStatus.CUSTOMS_CHECK) {
                        completionTick = playerShip.getCustomsCheckCompletedAtTick();
                    } else if (playerShip.getStatus() == ShipStatus.BLOCKED) {
                        int blockedUntil = playerShip.getCustomsBlockedUntilTick();
                        completionTick = blockedUntil > 0 ? blockedUntil : null;
                    }

                    positions.add(new ShipPositionsUpdateEvent.ShipPosition(
                            playerShip.getId(), playerShip.getPlayerId(), playerName,
                            iconUrl, port.x(), port.y(), status, completionTick,
                            null, null, null, null, null,
                            playerShip.getCurrentPortId()
                    ));
                }
            }
        }

        System.out.println("[ShipBroadcast] broadcasting " + positions.size() + " positions");

        if (!positions.isEmpty()) {
            webSocketController.broadcastShipPositions(
                    sessionId.toString(),
                    new ShipPositionsUpdateEvent(currentTick, positions)
            );
        }
    }

    private void processCargoLifecycle(UUID sessionId, int currentTick) {
        List<SessionCargo> all = sessionCargoRepository.findAllBySessionId(sessionId);
        boolean changed = false;

        for (SessionCargo sc : all) {
            if (sc.isExpiredAt(currentTick)) {
                sc.expire();
                sessionCargoRepository.save(sc);
                changed = true;
                System.out.println("[CargoExpiry] Cargo " + sc.getId() + " expired at tick " + currentTick);
            }
        }

        if (changed) {
            all = sessionCargoRepository.findAllBySessionId(sessionId);
        }

        Map<UUID, List<SessionCargo>> byPort = new HashMap<>();
        for (SessionCargo sc : all) {
            byPort.computeIfAbsent(sc.getOriginPortId(), k -> new ArrayList<>()).add(sc);
        }

        for (Map.Entry<UUID, List<SessionCargo>> entry : byPort.entrySet()) {
            UUID portId = entry.getKey();
            List<SessionCargo> portCargos = entry.getValue();

            long activeCount = 0;
            boolean hasPermanent = false;
            for (SessionCargo sc : portCargos) {
                if (sc.getCargoStatus() == CargoStatus.AVAILABLE) {
                    activeCount++;
                    if (sc.isPermanent()) {
                        hasPermanent = true;
                    }
                }
            }

            if (!hasPermanent && activeCount < MAX_ACTIVE_CARGOS_PER_PORT) {
                SessionCargo newPermanent = cargoSessionInitializer.createNewCargo(sessionId, portId, currentTick, rng, true);
                if (newPermanent != null) {
                    sessionCargoRepository.save(newPermanent);
                    activeCount++;
                    changed = true;
                    System.out.println("[CargoSpawn] New permanent cargo " + newPermanent.getId()
                            + " spawned at port " + portId + " at tick " + currentTick);
                }
            }

            while (activeCount < MAX_ACTIVE_CARGOS_PER_PORT) {
                double spawnChance = 0.25;
                if (rng.nextDouble() >= spawnChance) {
                    break;
                }
                SessionCargo newCargo = cargoSessionInitializer.createNewCargo(sessionId, portId, currentTick, rng, false);
                if (newCargo == null) break;
                sessionCargoRepository.save(newCargo);
                activeCount++;
                changed = true;
                System.out.println("[CargoSpawn] New cargo " + newCargo.getId()
                        + " spawned at port " + portId + " at tick " + currentTick);
            }
        }

        if (changed) {
            cargoWebSocketController.broadcastMarketUpdate(sessionId);
        }
    }
}
