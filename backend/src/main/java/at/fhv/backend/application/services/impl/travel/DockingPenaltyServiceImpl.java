package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.DockingPenaltyService;
import at.fhv.backend.application.services.travel.RegressService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import at.fhv.backend.application.services.travel.UnloadingStartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DockingPenaltyServiceImpl implements DockingPenaltyService {

    private static final BigDecimal DOCKING_FINE = new BigDecimal("300");
    private static final double DOCKING_WEAR_PERCENT = 10.0;
    private static final int CUSTOMS_CHECK_DURATION_TICKS = 2;

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final RegressService regressService;
    private final SessionCargoRepository sessionCargoRepository;
    private final UnloadingStartService unloadingStartService;

    public DockingPenaltyServiceImpl(TravelRepository travelRepository,
                                     PlayerShipRepository playerShipRepository,
                                     GameSessionRepository gameSessionRepository,
                                     RegressService regressService,
                                     SessionCargoRepository sessionCargoRepository,
                                     UnloadingStartService unloadingStartService) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.regressService = regressService;
        this.sessionCargoRepository = sessionCargoRepository;
        this.unloadingStartService = unloadingStartService;
    }

    @Override
    @Transactional
    public void applyArrivalFailurePenalty(UUID travelId, UUID playerId, UUID sessionId) {
        Travel travel = loadAndVerifyTravel(travelId, playerId);
        applyWear(travel.getPlayerShipId());
        travel.markDockingFailure(DOCKING_FINE);
        travel.setArrivalMiniGamePending(false);
        addDockingDelayToRegress(travel, sessionId);

        travelRepository.save(travel);
        startPostDockingPhase(travel, sessionId);
    }

    @Override
    @Transactional
    public void clearArrivalMiniGamePending(UUID travelId, UUID playerId, UUID sessionId) {
        Travel travel = loadAndVerifyTravel(travelId, playerId);
        travel.setArrivalMiniGamePending(false);
        addDockingDelayToRegress(travel, sessionId);

        travelRepository.save(travel);
        startPostDockingPhase(travel, sessionId);
    }

    @Override
    @Transactional
    public void applyDepartureFailurePenalty(UUID travelId, UUID playerId, UUID sessionId) {
        Travel travel = loadAndVerifyTravel(travelId, playerId);
        applyWear(travel.getPlayerShipId());
        travel.markDepartureDockingFailure(DOCKING_FINE);
        travelRepository.save(travel);
    }

    private void addDockingDelayToRegress(Travel travel, UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        int currentTick = session.getCurrentTick();
        int arrivalTick = travel.getArrivalTick();
        int dockingDelayTicks = Math.max(0, currentTick - arrivalTick);

        if (dockingDelayTicks > 0) {
            regressService.addDetentionDelay(travel.getTravelId(), dockingDelayTicks);
            System.out.println("[DockingPenalty] Travel " + travel.getTravelId()
                    + " — Anlege-Minigame dauerte " + dockingDelayTicks + " Ticks → als Regress-Delay addiert");
        }
    }


    private void startPostDockingPhase(Travel travel, UUID sessionId) {
        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship == null) return;

        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : travel.getArrivalTick();

        if (!hasCargoForArrival(travel)) {
            unloadingStartService.startUnloadingImmediately(travel);
            System.out.println("[DockingPenalty] Ship " + ship.getId()
                    + " — kein Cargo, direkt Entladen nach Anlegen");
            return;
        }

        int customsCheckCompletedAtTick = currentTick + CUSTOMS_CHECK_DURATION_TICKS;
        ship.arriveAndStartCustomsCheck(travel.getDestinationPortId(), customsCheckCompletedAtTick);
        playerShipRepository.save(ship);

        System.out.println("[DockingPenalty] Ship " + ship.getId()
                + " — Anlegen abgeschlossen, CUSTOMS_CHECK gestartet (bis Tick " + customsCheckCompletedAtTick + ")");
    }

    private boolean hasCargoForArrival(Travel travel) {
        List<SessionCargo> all = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());
        for (SessionCargo cargo : all) {
            boolean sameShip = cargo.getAssignedPlayerShipId() != null
                    && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId());
            boolean sameDestination = cargo.getDestinationPortId().equals(travel.getDestinationPortId());
            boolean stillOnBoard = cargo.getCargoStatus() == CargoStatus.ASSIGNED
                    || cargo.getCargoStatus() == CargoStatus.EXPIRED;
            if (sameShip && sameDestination && stillOnBoard) {
                return true;
            }
        }
        return false;
    }

    private Travel loadAndVerifyTravel(UUID travelId, UUID playerId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new RuntimeException("Travel not found: " + travelId));

        if (!travel.getPlayerId().equals(playerId)) {
            throw new SecurityException("Travel " + travelId + " does not belong to player " + playerId);
        }
        return travel;
    }

    private void applyWear(UUID playerShipId) {
        PlayerShip ship = playerShipRepository.findById(playerShipId)
                .orElseThrow(() -> new RuntimeException("PlayerShip not found: " + playerShipId));

        ship.applyWear(DOCKING_WEAR_PERCENT);
        playerShipRepository.save(ship);
    }
}
