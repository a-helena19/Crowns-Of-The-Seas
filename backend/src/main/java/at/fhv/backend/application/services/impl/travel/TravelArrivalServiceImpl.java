package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CargoUnloadingPhaseService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TravelArrivalServiceImpl implements TravelArrivalService {
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final CargoUnloadingPhaseService cargoUnloadingPhaseService;
    private final GameSessionRepository gameSessionRepository;

    private static final int BASE_UNLOADING_TICKS = 5;

    public TravelArrivalServiceImpl(
            TravelRepository travelRepository,
            PlayerShipRepository playerShipRepository,
            SessionCargoRepository sessionCargoRepository,
            CargoUnloadingPhaseService cargoUnloadingPhaseService,
            GameSessionRepository gameSessionRepository) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.cargoUnloadingPhaseService = cargoUnloadingPhaseService;
        this.gameSessionRepository = gameSessionRepository;
    }

    @Override
    @Transactional
    public void handleArrival(Travel travel) {
        travel.markAsArrived(0.0, travel.getTravelStatus());
        travelRepository.save(travel);

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        List<SessionCargo> cargosForPlayer = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());

        if (ship != null) {
            int unloadingDuration = calculateUnloadingTime(travel, cargosForPlayer);
            int unloadingCompletedAtTick = travel.getArrivalTick() + unloadingDuration;

            ship.arriveAndStartUnloading(travel.getDestinationPortId(), unloadingCompletedAtTick);
            playerShipRepository.save(ship);

            boolean miniGameRequired = !travel.isPilotageServiceBooked() || travel.isPilotageStrikeRevoked();
            travel.setArrivalMiniGamePending(miniGameRequired);
            travelRepository.save(travel);

            System.out.println("[TravelArrival] Ship " + ship.getId() + " arrived at port " + travel.getDestinationPortId());
            System.out.println("[TravelArrival] Ship set to UNLOADING status for " + unloadingDuration + " ticks (until tick " + unloadingCompletedAtTick + ")");
            System.out.println("[TravelArrival] arrivalMiniGamePending=" + miniGameRequired);
        }

        System.out.println("[TravelArrival] Found " + cargosForPlayer.size() + " cargos for player " + travel.getPlayerId());
        System.out.println("[TravelArrival] Cargo unloading will be triggered by scheduler when UNLOADING-phase complete");
    }

    public void triggerUnloadingIfComplete(Travel travel, int currentTick) {
        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);

        if (ship != null && !ship.isStillUnloading(currentTick)) {
            List<SessionCargo> cargosForPlayer =
                    sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());

            cargoUnloadingPhaseService.completeUnloadingPhase(travel, cargosForPlayer);

            System.out.println("[TravelArrival] Unloading complete for ship " + ship.getId() + " at tick " + currentTick);
        }
    }

    private int calculateUnloadingTime(Travel travel, List<SessionCargo> cargosForPlayer) {
        try {
            GameSession session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
            if (session == null) {
                return BASE_UNLOADING_TICKS;
            }

            ISessionPlayer player = session.getPlayers().stream()
                    .filter(p -> p.getUserId().equals(travel.getPlayerId()))
                    .findFirst()
                    .orElse(null);

            if (player == null) {
                return BASE_UNLOADING_TICKS;
            }

            int totalCapacity = cargosForPlayer.stream()
                    .filter(cargo -> cargo.getDestinationPortId().equals(travel.getDestinationPortId()))
                    .mapToInt(SessionCargo::getCapacity)
                    .sum();

            double capacityFactor = 1.0 + (totalCapacity / 100.0);
            double playerModifier = player.getUnloadingTimeModifier();
            int unloadingTicks = (int) Math.ceil(BASE_UNLOADING_TICKS * capacityFactor * playerModifier);
            unloadingTicks = Math.max(1, unloadingTicks);

            System.out.println("[UnloadingTime] totalCapacity=" + totalCapacity
                    + " capacityFactor=" + capacityFactor
                    + " playerUnloadingModifier=" + playerModifier
                    + " unloadingTicks=" + unloadingTicks);

            return unloadingTicks;
        } catch (Exception e) {
            System.err.println("[UnloadingTime] Error calculating unloading time: " + e.getMessage());
            return BASE_UNLOADING_TICKS;
        }
    }
}