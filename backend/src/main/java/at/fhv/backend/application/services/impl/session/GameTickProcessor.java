package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.minigame.ObstacleMinigameService;
import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.application.services.minigame.StormMinigameService;
import at.fhv.backend.application.services.minigame.TreasureHuntMinigameService;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Contains all tick processing logic inside a single @Transactional method.
 * Separated from GameTickScheduler so that Spring's AOP proxy can intercept
 * the call and manage the transaction properly.
 */
@Service
public class GameTickProcessor {

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
    private final ObstacleMinigameService obstacleMinigameService;
    private final TreasureHuntMinigameService treasureHuntMinigameService;
    private final CustomsService customsService;
    private final UnloadingStartService unloadingStartService;
    private final CustomsCheckCompletionService customsCheckCompletionService;
    private final PilotStrikeService pilotStrikeService;

    private static final int MAX_ACTIVE_CARGOS_PER_PORT = 7;

    // --- Static data caches (loaded once, never change during runtime) ---
    private volatile List<PortResponseDTO> cachedPorts;
    private volatile List<Ship> cachedShipTemplates;

    private final Random rng = new Random();

    public GameTickProcessor(GameSessionRepository gameSessionRepository,
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
                             ObstacleMinigameService obstacleMinigameService,
                             TreasureHuntMinigameService treasureHuntMinigameService,
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
        this.obstacleMinigameService = obstacleMinigameService;
        this.treasureHuntMinigameService = treasureHuntMinigameService;
        this.pilotStrikeService = pilotStrikeService;
        this.customsService = customsService;
        this.unloadingStartService = unloadingStartService;
        this.customsCheckCompletionService = customsCheckCompletionService;
    }

    // --- Static data cache helpers ---

    private List<PortResponseDTO> getCachedPorts() {
        if (cachedPorts == null) {
            cachedPorts = portQueryService.findAll();
        }
        return cachedPorts;
    }

    private List<Ship> getCachedShipTemplates() {
        if (cachedShipTemplates == null) {
            cachedShipTemplates = shipRepository.findAll();
        }
        return cachedShipTemplates;
    }

    TickContext buildTickContext(UUID sessionId, GameSession session, int currentTick) {
        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(sessionId);
        List<Travel> activeTravels = travelRepository.findAllInProgressBySessionId(sessionId);
        List<Travel> arrivedTravels = travelRepository.findAllBySessionIdAndStatus(sessionId, TravelStatus.ARRIVED);
        List<SessionCargo> allCargos = sessionCargoRepository.findAllBySessionId(sessionId);

        return new TickContext(
                sessionId, session, currentTick,
                allShips, activeTravels, arrivedTravels, allCargos,
                getCachedPorts(), getCachedShipTemplates()
        );
    }

    public enum TickResult {
        OK,
        SESSION_NOT_FOUND,
        RATE_LIMITED,
        SESSION_FINISHED
    }

    @Transactional
    public TickResult executeTick(UUID sessionId, long lastTickMs, long nowMs) {
        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return TickResult.SESSION_NOT_FOUND;
        }

        long minIntervalMs = Math.max(200L, session.getTickRateSeconds() * 1000L - 200L);
        if (lastTickMs > 0 && (nowMs - lastTickMs) < minIntervalMs) {
            return TickResult.RATE_LIMITED;
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
            return TickResult.SESSION_FINISHED;
        }

        gameSessionRepository.save(session);

        webSocketController.broadcastTickUpdate(
                sessionId.toString(),
                new TickUpdateEvent(currentTick, session.getTotalTicks())
        );

        // --- Build context: ONE load for all data ---
        TickContext ctx = buildTickContext(sessionId, session, currentTick);

        // --- Process game logic ---
        checkLoadingCompletion(ctx);
        checkRefuelingCompletion(ctx);
        checkRepairingCompletion(ctx);
        checkCustomsCheckCompletion(ctx);
        checkCustomsBlockCompletion(ctx);
        handleUnloadingPhase(ctx);
        pilotStrikeService.processTick(sessionId, currentTick, ctx.getAllPorts(), ctx.getActiveTravels());

        for (Travel travel : ctx.getActiveTravels()) {
            stormMinigameService.tryTriggerForTravel(travel, sessionId);
            if (travelPauseService.isTravelPaused(travel.getTravelId())) {
                continue;
            }
            obstacleMinigameService.tryTriggerForTravel(travel, sessionId);
            if (travelPauseService.isTravelPaused(travel.getTravelId())) {
                continue;
            }
            treasureHuntMinigameService.tryTriggerForTravel(travel, sessionId);
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

        processCargoLifecycle(ctx);

        // --- Batch save all modified ships ---
        if (!ctx.getModifiedShips().isEmpty()) {
            playerShipRepository.saveAll(ctx.getModifiedShips());
        }

        broadcastShipPositions(ctx);

        return TickResult.OK;
    }

    private void checkLoadingCompletion(TickContext ctx) {
        for (PlayerShip ship : ctx.getAllShips()) {
            if (ship.getStatus() == ShipStatus.LOADING
                    && ship.getLoadingCompletedAtTick() > 0
                    && ctx.getCurrentTick() >= ship.getLoadingCompletedAtTick()) {

                ship.completeLoading();
                ctx.markShipModified(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " loading completed at tick " + ctx.getCurrentTick() + " → READY_TO_DEPART");
            }
        }
    }

    private void checkRefuelingCompletion(TickContext ctx) {
        for (PlayerShip ship : ctx.getAllShips()) {
            if (ship.getStatus() == ShipStatus.REFUELING
                    && ship.getRefuelingCompletedAtTick() > 0
                    && ctx.getCurrentTick() >= ship.getRefuelingCompletedAtTick()) {

                ship.completeRefueling();
                ctx.markShipModified(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " refueling completed at tick " + ctx.getCurrentTick() + " → AT_PORT");
            }
        }
    }

    private void checkRepairingCompletion(TickContext ctx) {
        for (PlayerShip ship : ctx.getAllShips()) {
            if (ship.getStatus() == ShipStatus.REPAIRING
                    && ship.getRepairingCompletedAtTick() > 0
                    && ctx.getCurrentTick() >= ship.getRepairingCompletedAtTick()) {

                ship.completeRepairing();
                ctx.markShipModified(ship);

                System.out.println("[GameTick] Ship " + ship.getId()
                        + " repairing completed at tick " + ctx.getCurrentTick() + " → AT_PORT");
            }
        }
    }

    private void checkCustomsCheckCompletion(TickContext ctx) {
        for (Travel travel : ctx.getArrivedTravels()) {
            PlayerShip ship = ctx.getShipById(travel.getPlayerShipId());
            if (ship == null) continue;
            if (ship.getStatus() != ShipStatus.CUSTOMS_CHECK) continue;

            int completedAtTick = ship.getCustomsCheckCompletedAtTick();
            if (completedAtTick < 0) continue;
            if (ctx.getCurrentTick() < completedAtTick) continue;

            customsCheckCompletionService.completeCustomsCheck(travel.getTravelId());
        }
    }

    private void checkCustomsBlockCompletion(TickContext ctx) {
        for (Travel travel : ctx.getArrivedTravels()) {
            PlayerShip ship = ctx.getShipById(travel.getPlayerShipId());
            if (ship == null) continue;
            if (ship.getStatus() != ShipStatus.BLOCKED) continue;

            int expirationTick = customsService.getBlockExpirationTick(travel.getTravelId());
            if (expirationTick < 0) continue;
            if (ctx.getCurrentTick() < expirationTick) continue;

            unloadingStartService.startUnloadingAfterDetention(travel.getTravelId());
            customsService.clearBlockTracking(travel.getTravelId());
            System.out.println("[GameTick] Customs block expired for travel " + travel.getTravelId()
                    + " — ship now UNLOADING");
        }
    }

    private void handleUnloadingPhase(TickContext ctx) {
        for (Travel travel : ctx.getArrivedTravels()) {
            PlayerShip ship = ctx.getShipById(travel.getPlayerShipId());
            if (ship == null) continue;
            if (ship.getStatus() != ShipStatus.UNLOADING) continue;
            if (travel.isArrivalMiniGamePending()) continue;

            if (ship.getUnloadingCompletedAtTick() != null
                    && ctx.getCurrentTick() >= ship.getUnloadingCompletedAtTick()) {
                handleUnloadingComplete(travel, ctx);
            }
        }
    }

    private void handleUnloadingComplete(Travel travel, TickContext ctx) {
        PlayerShip ship = ctx.getShipById(travel.getPlayerShipId());

        if (ship == null || ship.getStatus() != ShipStatus.UNLOADING) {
            return;
        }

        List<SessionCargo> cargos = new ArrayList<>();
        for (SessionCargo sc : ctx.getAllCargos()) {
            if (travel.getPlayerId().equals(sc.getAssignedPlayerId())) {
                cargos.add(sc);
            }
        }

        BigDecimal reward = cargoUnloadingPhaseService.completeUnloadingPhase(travel, cargos);

        System.out.println("[GameTick] Unloading complete for travel " + travel.getTravelId());
        System.out.println("[GameTick] Reward: " + reward);
    }

    private void processCargoLifecycle(TickContext ctx) {
        List<SessionCargo> all = ctx.getAllCargos();
        boolean changed = false;

        for (SessionCargo sc : all) {
            if (sc.isExpiredAt(ctx.getCurrentTick())) {
                sc.expire();
                sessionCargoRepository.save(sc);
                changed = true;
                System.out.println("[CargoExpiry] Cargo " + sc.getId() + " expired at tick " + ctx.getCurrentTick());
            }
        }

        if (changed) {
            all = sessionCargoRepository.findAllBySessionId(ctx.getSessionId());
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
                SessionCargo newPermanent = cargoSessionInitializer.createNewCargo(
                        ctx.getSessionId(), portId, ctx.getCurrentTick(), rng, true);
                if (newPermanent != null) {
                    sessionCargoRepository.save(newPermanent);
                    activeCount++;
                    changed = true;
                    System.out.println("[CargoSpawn] New permanent cargo " + newPermanent.getId()
                            + " spawned at port " + portId + " at tick " + ctx.getCurrentTick());
                }
            }

            while (activeCount < MAX_ACTIVE_CARGOS_PER_PORT) {
                double spawnChance = 0.25;
                if (rng.nextDouble() >= spawnChance) {
                    break;
                }
                SessionCargo newCargo = cargoSessionInitializer.createNewCargo(
                        ctx.getSessionId(), portId, ctx.getCurrentTick(), rng, false);
                if (newCargo == null) break;
                sessionCargoRepository.save(newCargo);
                activeCount++;
                changed = true;
                System.out.println("[CargoSpawn] New cargo " + newCargo.getId()
                        + " spawned at port " + portId + " at tick " + ctx.getCurrentTick());
            }
        }

        if (changed) {
            cargoWebSocketController.broadcastMarketUpdate(ctx.getSessionId());
        }
    }

    void broadcastShipPositions(TickContext ctx) {
        Map<UUID, PortResponseDTO> portMap = ctx.getPortMap();
        int currentTick = ctx.getCurrentTick();
        GameSession session = ctx.getSession();

        Map<UUID, Travel> travelByShipId = new HashMap<>(ctx.getActiveTravelByShipId());
        for (Travel t : ctx.getArrivedTravels()) {
            if (t.isArrivalMiniGamePending()) {
                travelByShipId.putIfAbsent(t.getPlayerShipId(), t);
            }
        }

        List<PlayerShip> allShips = playerShipRepository.findAllBySessionId(ctx.getSessionId());

        System.out.println("[ShipBroadcast] tick=" + currentTick
                + " ships=" + allShips.size()
                + " activeTravels=" + ctx.getActiveTravels().size()
                + " ports=" + portMap.size());

        List<ShipPositionsUpdateEvent.ShipPosition> positions = new ArrayList<>();

        for (PlayerShip playerShip : allShips) {
            if (playerShip.getStatus() == ShipStatus.IN_REGISTRATION) continue;

            Ship shipTemplate = ctx.getShipTemplate(playerShip.getShipId());
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
                    ctx.getSessionId().toString(),
                    new ShipPositionsUpdateEvent(currentTick, positions)
            );
        }
    }

    public void triggerImmediateBroadcast(UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;
        TickContext ctx = buildTickContext(sessionId, session, session.getCurrentTick());
        broadcastShipPositions(ctx);
    }
}
