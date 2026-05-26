package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.RegressService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.application.services.travel.UnloadingStartService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TravelArrivalServiceImpl implements TravelArrivalService {
    private static final int CUSTOMS_CHECK_DURATION_TICKS = 2;

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final UnloadingStartService unloadingStartService;
    private final RegressService regressService;

    public TravelArrivalServiceImpl(TravelRepository travelRepository,
                                    PlayerShipRepository playerShipRepository,
                                    SessionCargoRepository sessionCargoRepository,
                                    UnloadingStartService unloadingStartService,
                                    RegressService regressService) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.unloadingStartService = unloadingStartService;
        this.regressService = regressService;
    }

    @Override
    @Transactional
    public void handleArrival(Travel travel) {
        travel.markAsArrived(0.0);

        boolean miniGameRequired = !travel.isPilotageServiceBooked() || travel.isPilotageStrikeRevoked();
        travel.setArrivalMiniGamePending(miniGameRequired);
        travelRepository.save(travel);

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId())
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", travel.getPlayerShipId()));

        List<SessionCargo> cargosForRegress = collectCargosOnBoardForTravel(travel);
        regressService.evaluateAndStore(
                travel,
                travel.getArrivalTick(),
                ship.getCondition(),
                cargosForRegress
        );

        if (miniGameRequired) {
            System.out.println("[TravelArrival] Ship " + ship.getId()
                    + " arrived at port " + travel.getDestinationPortId()
                    + " — awaiting manual docking (miniGame pending), customs deferred");
            return;
        }

        if (!hasCargoForArrival(travel)) {
            unloadingStartService.startUnloadingImmediately(travel);
            System.out.println("[TravelArrival] Ship " + ship.getId()
                    + " arrived at port " + travel.getDestinationPortId()
                    + " with no cargo — unloading started immediately");
            return;
        }

        int customsCheckCompletedAtTick = travel.getArrivalTick() + CUSTOMS_CHECK_DURATION_TICKS;
        ship.arriveAndStartCustomsCheck(travel.getDestinationPortId(), customsCheckCompletedAtTick);
        playerShipRepository.save(ship);

        System.out.println("[TravelArrival] Ship " + ship.getId()
                + " arrived at port " + travel.getDestinationPortId()
                + " — entered CUSTOMS_CHECK (2 ticks, until tick " + customsCheckCompletedAtTick + ")");
    }

    private List<SessionCargo> collectCargosOnBoardForTravel(Travel travel) {
        List<SessionCargo> result = new ArrayList<>();
        List<SessionCargo> all = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());
        for (SessionCargo cargo : all) {
            boolean sameShip = cargo.getAssignedPlayerShipId() != null
                    && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId());
            boolean sameDestination = cargo.getDestinationPortId().equals(travel.getDestinationPortId());
            if (sameShip && sameDestination) {
                result.add(cargo);
            }
        }
        return result;
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
}