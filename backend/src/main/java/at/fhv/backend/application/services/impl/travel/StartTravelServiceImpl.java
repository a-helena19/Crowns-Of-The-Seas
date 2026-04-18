package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.StartTravelService;
import at.fhv.backend.application.services.travel.ValidateTravelService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.domain.model.travel.TravelStatus;
import at.fhv.backend.infrastructure.mapper.TravelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StartTravelServiceImpl implements StartTravelService {
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final PortInfoHelper portInfoHelper;
    private final CalculateFuelConsumptionService calculateFuelConsumptionService;
    private final ValidateTravelService validateTravelService;
    private final TravelRepository travelRepository;
    private final TravelMapper travelMapper;
    private final TravelResponseMapper travelResponseMapper;
    private final GameSessionRepository gameSessionRepository;
    private final GameTickScheduler gameTickScheduler;

    public StartTravelServiceImpl(PlayerShipRepository playerShipRepository, ShipRepository shipRepository, PortInfoHelper portInfoHelper,
                                  CalculateFuelConsumptionService calculateFuelConsumptionService, ValidateTravelService validateTravelService,
                                  TravelRepository travelRepository, TravelMapper travelMapper, TravelResponseMapper travelResponseMapper,
                                  GameSessionRepository gameSessionRepository, GameTickScheduler gameTickScheduler) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.portInfoHelper = portInfoHelper;
        this.calculateFuelConsumptionService = calculateFuelConsumptionService;
        this.validateTravelService = validateTravelService;
        this.travelRepository = travelRepository;
        this.travelMapper = travelMapper;
        this.travelResponseMapper = travelResponseMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.gameTickScheduler = gameTickScheduler;
    }

    @Override
    @Transactional
    public TravelDTO startTravel(UUID playerId, UUID sessionId, StartTravelDTO request) {
        try {


            System.out.println("START TRAVEL");
            PlayerShip playerShip = playerShipRepository
                    .findByIdAndPlayerIdAndSessionId(request.getPlayerShipId(), playerId, sessionId)
                    .orElseThrow(() -> new ShipNotFoundException("PlayerShip", request.getPlayerShipId()));

            System.out.println("Ship status: " + playerShip.getStatus());
            System.out.println("Ship currentPortId: " + playerShip.getCurrentPortId());
            Ship ship = shipRepository.findById(playerShip.getShipId()).orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));

            UUID destinationPortId = request.getDestinationPortId();
            // Zielhafen validieren - skipped, port gibt es noch nicht
            // PortNotFoundException

            UUID originPortId = playerShip.getCurrentPortId();
            System.out.println("originPortId: " + originPortId);
            System.out.println("destinationPortId: " + destinationPortId);

            if (originPortId == null) {
                // Fallback solange Ports noch nicht implementiert sind
                originPortId = UUID.fromString("00000000-0000-0000-0000-000000000099");
                System.out.println("originPortId was null, using fallback");
            }

            double distance;

            try {
                distance = portInfoHelper.getDistance(originPortId, destinationPortId);
            } catch (Exception e) {
                System.out.println("Distance fallback used");
                distance = 1000;
            }

            double speedMultiplier = 1.0 + Math.pow(request.getSpeedSetting() / ship.getMaxSpeed() - 0.5, 2);
            double requiredFuelPercent = calculateFuelConsumptionService.calculateFuelConsumption(ship, distance) * speedMultiplier;
            System.out.println("requiredFuel: " + requiredFuelPercent);

            validateTravelService.validateTravelStart(playerShip, playerId, originPortId, destinationPortId, requiredFuelPercent);
            System.out.println("Validation passed");

            double riskFactor = calculateRiskFactor(playerShip, ship);
            BigDecimal baseReward = calculateBaseReward(distance);

            GameSession session = gameSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new SessionNotFoundException(sessionId));
            int currentTick = session.getCurrentTick();

            Travel travel = Travel.start(
                    playerShip.getId(), playerId, sessionId,
                    originPortId, destinationPortId,
                    distance, request.getSpeedSetting(),
                    riskFactor, baseReward,
                    currentTick
            );

            playerShip.departForVoyage(destinationPortId);
            playerShipRepository.save(playerShip);
            Travel saved = travelRepository.save(travel);

            // Sofort Schiffspositionen broadcasten, ohne auf den nächsten Tick zu warten
            gameTickScheduler.triggerImmediateBroadcast(sessionId);

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

    private BigDecimal calculateBaseReward(double distance) {
        return BigDecimal.valueOf(Math.round(distance * 100));
    }
}