package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.dtos.mapper.TravelResponseMapper;
import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.travel.PendingTravelStartService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.rest.CargoWebSocketController;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingTravelStartServiceImpl implements PendingTravelStartService {
    public static final class PendingData {
        private final double requiredFuelPercent;
        private final double conditionWearPercent;
        private final int startTickDelay;

        public PendingData(double requiredFuelPercent, double conditionWearPercent, int startTickDelay) {
            this.requiredFuelPercent = requiredFuelPercent;
            this.conditionWearPercent = conditionWearPercent;
            this.startTickDelay = startTickDelay;
        }

        public double getRequiredFuelPercent() { return requiredFuelPercent; }
        public double getConditionWearPercent() { return conditionWearPercent; }
        public int getStartTickDelay() { return startTickDelay; }
    }

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameTickScheduler gameTickScheduler;
    private final CargoWebSocketController cargoWebSocketController;
    private final TravelResponseMapper travelResponseMapper;
    private final GameSessionRepository gameSessionRepository;

    private final Map<UUID, PendingData> pendingByTravelId = new ConcurrentHashMap<>();

    public PendingTravelStartServiceImpl(TravelRepository travelRepository,
                                         PlayerShipRepository playerShipRepository,
                                         @Lazy GameTickScheduler gameTickScheduler,
                                         CargoWebSocketController cargoWebSocketController,
                                         TravelResponseMapper travelResponseMapper,
                                         GameSessionRepository gameSessionRepository) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameTickScheduler = gameTickScheduler;
        this.cargoWebSocketController = cargoWebSocketController;
        this.travelResponseMapper = travelResponseMapper;
        this.gameSessionRepository = gameSessionRepository;
    }

    public void registerPendingData(UUID travelId, PendingData data) {
        pendingByTravelId.put(travelId, data);
    }

    @Override
    @Transactional
    public void finalizePlannedTravel(UUID travelId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new TravelNotFoundException("Travel", travelId));

        PendingData data = pendingByTravelId.remove(travelId);
        if (data == null) {
            System.err.println("[PendingTravelStart] No pending data for travel " + travelId
                    + " — was it already finalised?");
            return;
        }

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId())
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", travel.getPlayerShipId()));

        ship.consumeFuel(data.getRequiredFuelPercent());
        ship.applyWear(data.getConditionWearPercent());
        ship.depart();
        playerShipRepository.save(ship);

        var session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : 0;
        travel.activate(currentTick, data.getStartTickDelay());
        travelRepository.save(travel);

        gameTickScheduler.triggerImmediateBroadcast(travel.getSessionId());
        cargoWebSocketController.broadcastMarketUpdate(travel.getSessionId());

        System.out.println("[PendingTravelStart] Travel " + travelId
                + " finalised — ship departed, startTick=" + travel.getStartTick()
                + " arrivalTick=" + travel.getArrivalTick());
    }

    @Override
    @Transactional
    public void cancelPlannedTravel(UUID travelId) {
        pendingByTravelId.remove(travelId);
        Travel travel = travelRepository.findById(travelId).orElse(null);
        if (travel == null) {
            return;
        }
        travel.cancel();
        travelRepository.save(travel);
        System.out.println("[PendingTravelStart] Travel " + travelId + " cancelled");
    }
}

