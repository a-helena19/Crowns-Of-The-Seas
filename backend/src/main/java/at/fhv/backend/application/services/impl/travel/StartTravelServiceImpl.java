package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.ship.*;
import at.fhv.backend.rest.CargoWebSocketController;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.StartTravelService;
import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StartTravelServiceImpl implements StartTravelService {
    private static final double GLOBAL_TRAVEL_SPEED_FACTOR = 0.75;
    private static final BigDecimal PILOTAGE_COST = new BigDecimal("600");
    private static final int DEPARTURE_ANIMATION_MS = 3000;
    private static final int DEPARTURE_START_BUFFER_TICKS = 0;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final PortQueryService portQueryService;
    private final CalculateFuelConsumptionService calculateFuelConsumptionService;
    private final ValidateTravelService validateTravelService;
    private final TravelRepository travelRepository;
    private final TravelResponseMapper travelResponseMapper;
    private final GameSessionRepository gameSessionRepository;
    private final GameTickScheduler gameTickScheduler;
    private final SessionCargoRepository sessionCargoRepository;
    private final CargoWebSocketController cargoWebSocketController;
    private final PortDistanceForCargoService portDistanceForCargoService;
    private final SessionPlayerRepository sessionPlayerRepository;

    public StartTravelServiceImpl(PlayerShipRepository playerShipRepository,
                                  ShipRepository shipRepository,
                                  PortQueryService portQueryService,
                                  CalculateFuelConsumptionService calculateFuelConsumptionService,
                                  ValidateTravelService validateTravelService,
                                  TravelRepository travelRepository,
                                  TravelResponseMapper travelResponseMapper,
                                  GameSessionRepository gameSessionRepository,
                                  GameTickScheduler gameTickScheduler,
                                  SessionCargoRepository sessionCargoRepository,
                                  CargoWebSocketController cargoWebSocketController,
                                  PortDistanceForCargoService portDistanceForCargoService,
                                  SessionPlayerRepository sessionPlayerRepository) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.portQueryService = portQueryService;
        this.calculateFuelConsumptionService = calculateFuelConsumptionService;
        this.validateTravelService = validateTravelService;
        this.travelRepository = travelRepository;
        this.travelResponseMapper = travelResponseMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.gameTickScheduler = gameTickScheduler;
        this.sessionCargoRepository = sessionCargoRepository;
        this.cargoWebSocketController = cargoWebSocketController;
        this.portDistanceForCargoService = portDistanceForCargoService;
        this.sessionPlayerRepository = sessionPlayerRepository;
    }

    @Override
    @Transactional
    public TravelDTO startTravel(UUID playerId, UUID sessionId, StartTravelDTO request) {
        try {
            PlayerShip playerShip = playerShipRepository
                    .findByIdAndPlayerIdAndSessionId(request.getPlayerShipId(), playerId, sessionId)
                    .orElseThrow(() -> new ShipNotFoundException("PlayerShip", request.getPlayerShipId()));

            Ship ship = shipRepository.findById(playerShip.getShipId())
                    .orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));

            if (playerShip.getStatus() != ShipStatus.LOADING) {
                throw new InvalidShipStatusTransition(
                        "Ship must be in LOADING status to start travel",
                        "shipId",
                        playerShip.getId()
                );
            }

            UUID originPortId = playerShip.getCurrentPortId();
            UUID destinationPortId = request.getDestinationPortId();

            SessionCargo cargo = sessionCargoRepository
                    .findByIdForUpdate(request.getSessionCargoId())
                    .orElseThrow(() -> new CargoNotFoundException(request.getSessionCargoId()));

            if (cargo.getCargoStatus() != CargoStatus.ASSIGNED) {
                throw new CargoNotAvailableException(cargo.getId());
            }

            GameSession session = gameSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new SessionNotFoundException(sessionId));
            int currentTick = session.getCurrentTick();

            ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                    .orElseThrow(() -> new PlayerNotFoundException(playerId));

            int loadingCompletedAtTick = playerShip.getLoadingCompletedAtTick();
            double loadingDurationSeconds = (loadingCompletedAtTick - currentTick) * session.getTickRateSeconds();

            double distance = portDistanceForCargoService.distanceBetween(originPortId, destinationPortId);
            double speedSetting = Math.max(0.25, Math.min(1.0, request.getSpeedSetting()));
            double speedMultiplier = 0.5 + speedSetting;
            double baseFuelAbsolute = calculateFuelConsumptionService.calculateFuelConsumption(ship, distance);
            double requiredFuelAbsolute = baseFuelAbsolute * speedMultiplier;

            validateTravelService.validateTravelStart(playerShip, ship, playerId,
                    originPortId, destinationPortId, requiredFuelAbsolute);

            double requiredFuelPercent = (requiredFuelAbsolute / ship.getMaxFuel().doubleValue()) * 100.0;

            playerShip.consumeFuel(requiredFuelPercent);
            playerShipRepository.save(playerShip);

            double riskFactor = calculateRiskFactor(playerShip, ship);
            BigDecimal baseReward = cargo.getReward();
            double effectiveSpeed = ship.getMaxSpeed() * speedSetting * GLOBAL_TRAVEL_SPEED_FACTOR;

            int startTickDelay = 0;
            if (request.isPilotageService()) {
                int tickRateSeconds = Math.max(1, session.getTickRateSeconds());
                double wallSeconds = DEPARTURE_ANIMATION_MS / 1000.0;
                int delayForOverlay = (int) Math.ceil(wallSeconds / tickRateSeconds);
                startTickDelay = delayForOverlay + DEPARTURE_START_BUFFER_TICKS;
            }

            Travel travel = Travel.start(
                    playerShip.getId(), playerId, sessionId,
                    originPortId, destinationPortId,
                    distance, effectiveSpeed,
                    riskFactor, baseReward,
                    currentTick,
                    startTickDelay
            );

            travel.setLoadingDurationSeconds(loadingDurationSeconds);

            Travel saved = travelRepository.save(travel);

            if (request.isPilotageService()) {
                player.subtractBalance(PILOTAGE_COST);
                sessionPlayerRepository.save(player);
            }

            gameTickScheduler.triggerImmediateBroadcast(sessionId);
            cargoWebSocketController.broadcastMarketUpdate(sessionId);

            return travelResponseMapper.toResponse(saved);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TravelDTO> getActiveTravels(UUID playerId) {
        return travelRepository.findAllByPlayerIdAndStatus(playerId, TravelStatus.IN_PROGRESS)
                .stream()
                .map(travelResponseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TravelDTO getTravelStatus(UUID travelId, UUID playerId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new TravelNotFoundException("Travel", travelId));

        if (!travel.getPlayerId().equals(playerId)) {
            throw new ShipNotFoundException("Player", playerId);
        }

        return travelResponseMapper.toResponse(travel);
    }

    private double calculateRiskFactor(PlayerShip playerShip, Ship ship) {
        double effectiveReliability = (playerShip.getCondition() / 100.0) * ship.getBaseReliability();
        return 1.0 - effectiveReliability;
    }
}