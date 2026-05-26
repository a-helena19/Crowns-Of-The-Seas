package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.UnloadingStartService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
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
public class UnloadingStartServiceImpl implements UnloadingStartService {
    private static final int BASE_UNLOADING_TICKS = 5;

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final GameSessionRepository gameSessionRepository;

    public UnloadingStartServiceImpl(TravelRepository travelRepository,
                                     PlayerShipRepository playerShipRepository,
                                     SessionCargoRepository sessionCargoRepository,
                                     GameSessionRepository gameSessionRepository) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.gameSessionRepository = gameSessionRepository;
    }

    @Override
    @Transactional
    public void startUnloadingImmediately(Travel travel) {
        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship == null) {
            return;
        }
        int unloadingDuration = computeUnloadingTicks(travel);
        int unloadingCompletedAtTick = travel.getArrivalTick() + unloadingDuration;

        ship.arriveAndStartUnloading(travel.getDestinationPortId(), unloadingCompletedAtTick);
        playerShipRepository.save(ship);

        System.out.println("[UnloadingStart] Ship " + ship.getId()
                + " entered UNLOADING for " + unloadingDuration + " ticks"
                + " (until tick " + unloadingCompletedAtTick + ")");
    }

    @Override
    @Transactional
    public void startUnloadingAfterCustomsCheck(UUID travelId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new TravelNotFoundException("Travel", travelId));

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship == null) {
            return;
        }

        int unloadingDuration = computeUnloadingTicks(travel);
        GameSession session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : travel.getArrivalTick();
        int unloadingCompletedAtTick = currentTick + unloadingDuration;

        ship.completeCustomsCheckAndStartUnloading(unloadingCompletedAtTick);
        playerShipRepository.save(ship);

        System.out.println("[UnloadingStart] Ship " + ship.getId()
                + " left CUSTOMS_CHECK, entered UNLOADING for " + unloadingDuration + " ticks"
                + " (until tick " + unloadingCompletedAtTick + ")");
    }

    @Override
    @Transactional
    public void startUnloadingAfterDetention(UUID travelId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new TravelNotFoundException("Travel", travelId));

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship == null) {
            return;
        }

        int unloadingDuration = computeUnloadingTicks(travel);
        GameSession session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : travel.getArrivalTick();
        int unloadingCompletedAtTick = currentTick + unloadingDuration;

        ship.completeCustomsBlockAndStartUnloading(unloadingCompletedAtTick);
        playerShipRepository.save(ship);

        System.out.println("[UnloadingStart] Ship " + ship.getId()
                + " left BLOCKED, entered UNLOADING for " + unloadingDuration + " ticks"
                + " (until tick " + unloadingCompletedAtTick + ")");
    }

    @Override
    public int computeUnloadingTicks(Travel travel) {
        GameSession session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
        if (session == null) {
            return BASE_UNLOADING_TICKS;
        }

        ISessionPlayer player = null;
        for (ISessionPlayer p : session.getPlayers()) {
            if (p.getUserId().equals(travel.getPlayerId())) {
                player = p;
                break;
            }
        }
        if (player == null) {
            return BASE_UNLOADING_TICKS;
        }

        List<SessionCargo> cargosForPlayer = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());
        int totalCapacity = 0;
        for (SessionCargo cargo : cargosForPlayer) {
            boolean sameShip = cargo.getAssignedPlayerShipId() != null
                    && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId());
            boolean sameDestination = cargo.getDestinationPortId().equals(travel.getDestinationPortId());
            if (sameShip && sameDestination) {
                totalCapacity += cargo.getCapacity();
            }
        }

        double capacityFactor = 1.0 + (totalCapacity / 100.0);
        double playerModifier = player.getUnloadingTimeModifier();
        int unloadingTicks = (int) Math.ceil(BASE_UNLOADING_TICKS * capacityFactor * playerModifier);
        return Math.max(1, unloadingTicks);
    }
}