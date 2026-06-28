package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.pilotstrike.PilotStrikeService;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.DockingPenaltyService;
import at.fhv.backend.application.services.travel.RegressService;
import at.fhv.backend.application.services.travel.StartEmptyVoyageService;
import at.fhv.backend.domain.model.exception.InsufficientFuelException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.PilotStrikeActiveException;
import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.dtos.ship.request.StartEmptyVoyageDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class StartEmptyVoyageServiceImpl implements StartEmptyVoyageService {
    private static final double GLOBAL_TRAVEL_SPEED_FACTOR = 0.75;
    private static final double CONDITION_WEAR_FACTOR = 0.08;
    private static final BigDecimal PILOTAGE_COST = new BigDecimal("1000");
    private static final int DEPARTURE_ANIMATION_MS = 3000;
    private static final int DEPARTURE_START_BUFFER_TICKS = 0;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PortDistanceForCargoService portDistanceForCargoService;
    private final CalculateFuelConsumptionService calculateFuelConsumptionService;
    private final TravelRepository travelRepository;
    private final TravelResponseMapper travelResponseMapper;
    private final RegressService regressService;
    private final GameTickScheduler gameTickScheduler;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final PilotStrikeService pilotStrikeService;
    private final DockingPenaltyService dockingPenaltyService;

    public StartEmptyVoyageServiceImpl(PlayerShipRepository playerShipRepository,
                                       ShipRepository shipRepository,
                                       GameSessionRepository gameSessionRepository,
                                       PortDistanceForCargoService portDistanceForCargoService,
                                       CalculateFuelConsumptionService calculateFuelConsumptionService,
                                       TravelRepository travelRepository,
                                       TravelResponseMapper travelResponseMapper,
                                       RegressService regressService,
                                       GameTickScheduler gameTickScheduler,
                                       SessionPlayerRepository sessionPlayerRepository,
                                       PilotStrikeService pilotStrikeService,
                                       DockingPenaltyService dockingPenaltyService) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.portDistanceForCargoService = portDistanceForCargoService;
        this.calculateFuelConsumptionService = calculateFuelConsumptionService;
        this.travelRepository = travelRepository;
        this.travelResponseMapper = travelResponseMapper;
        this.regressService = regressService;
        this.gameTickScheduler = gameTickScheduler;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.pilotStrikeService = pilotStrikeService;
        this.dockingPenaltyService = dockingPenaltyService;
    }

    @Override
    @Transactional
    public TravelDTO startEmptyVoyage(UUID playerId, UUID sessionId, StartEmptyVoyageDTO request) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(request.getPlayerShipId(), playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", request.getPlayerShipId()));

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));

        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        if (!playerShip.isOwnedBy(playerId)) {
            throw new ShipNotOwnedException("Ship is not owned by player", playerId);
        }

        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be in AT_PORT status to start an empty voyage", "shipId", playerShip.getId());
        }

        UUID originPortId = playerShip.getCurrentPortId();
        UUID destinationPortId = request.getDestinationPortId();

        if (originPortId == null || originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same origin and destination port: ", originPortId);
        }

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        if (request.isPilotageService()) {
            if (pilotStrikeService.isStrikeActive(sessionId, originPortId)) {
                throw new PilotStrikeActiveException(
                        "Lotsenstreik am Abfahrtshafen — Lotsendienst nicht verfügbar.", originPortId);
            }
            if (pilotStrikeService.isStrikeActive(sessionId, destinationPortId)) {
                throw new PilotStrikeActiveException(
                        "Lotsenstreik am Ankunftshafen — Lotsendienst nicht verfügbar.", destinationPortId);
            }
            // Pay-on-book: wirft InsufficientBalanceException bei zu geringem Guthaben.
            player.subtractBalance(PILOTAGE_COST);
            sessionPlayerRepository.save(player);
        }

        double distance = portDistanceForCargoService.distanceBetween(originPortId, destinationPortId);
        double speedSetting = Math.max(0.25, Math.min(1.0, request.getSpeedSetting()));

        double speedMultiplier = 0.5 + speedSetting;
        double baseFuelAbsolute = calculateFuelConsumptionService.calculateFuelConsumption(ship, distance);
        double requiredFuelAbsolute = baseFuelAbsolute * speedMultiplier;

        double maxFuel = ship.getMaxFuel().doubleValue();
        double availableFuelAbsolute = (playerShip.getFuel() / 100.0) * maxFuel;
        double requiredFuelPercent = (requiredFuelAbsolute / maxFuel) * 100.0;

        if (availableFuelAbsolute < requiredFuelAbsolute) {
            throw new InsufficientFuelException("Insufficient fuel", requiredFuelPercent, playerShip.getFuel());
        }

        double conditionWearPercent = requiredFuelPercent * CONDITION_WEAR_FACTOR;
        double riskFactor = calculateRiskFactor(playerShip, ship);
        double effectiveSpeed = ship.getMaxSpeed() * speedSetting * GLOBAL_TRAVEL_SPEED_FACTOR;

        int startTickDelay = 0;
        if (request.isPilotageService()) {
            int tickRateSeconds = Math.max(1, session.getTickRateSeconds());
            double wallSeconds = DEPARTURE_ANIMATION_MS / 1000.0;
            int delayForOverlay = (int) Math.ceil(wallSeconds / tickRateSeconds);
            startTickDelay = delayForOverlay + DEPARTURE_START_BUFFER_TICKS;
        }

        int currentTick = session.getCurrentTick();

        Travel travel = Travel.startEmpty(
                playerShip.getId(), playerId, sessionId,
                originPortId, destinationPortId,
                distance, effectiveSpeed,
                riskFactor, currentTick, startTickDelay
        );
        travel.setPilotageServiceBooked(request.isPilotageService());
        Travel saved = travelRepository.save(travel);

        if (request.isMiniGameFailedDeparture()) {
            dockingPenaltyService.applyDepartureFailurePenalty(saved.getTravelId(), playerId, sessionId);
        }

        regressService.recordConditionAtStart(saved.getTravelId(), playerShip.getCondition());

        playerShip.consumeFuel(requiredFuelPercent);
        playerShip.applyWear(conditionWearPercent);
        playerShip.departForVoyage(destinationPortId);
        playerShipRepository.save(playerShip);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);

        System.out.println("[StartEmptyVoyage] Ship " + playerShip.getId()
                + " departed on empty voyage from " + originPortId + " to " + destinationPortId
                + " (travel " + saved.getTravelId() + ", pilotage=" + request.isPilotageService() + ")");

        return travelResponseMapper.toResponse(saved);
    }

    private double calculateRiskFactor(PlayerShip playerShip, Ship ship) {
        double effectiveReliability = (playerShip.getCondition() / 100.0) * ship.getBaseReliability();
        return 1.0 - effectiveReliability;
    }
}