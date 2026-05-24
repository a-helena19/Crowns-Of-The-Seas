package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.application.services.travel.UnloadingStartService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TravelArrivalServiceImpl implements TravelArrivalService {

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final CustomsService customsService;
    private final UnloadingStartService unloadingStartService;

    public TravelArrivalServiceImpl(TravelRepository travelRepository,
                                    PlayerShipRepository playerShipRepository,
                                    CustomsService customsService,
                                    UnloadingStartService unloadingStartService) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.customsService = customsService;
        this.unloadingStartService = unloadingStartService;
    }

    @Override
    @Transactional
    public void handleArrival(Travel travel) {
        travel.markAsArrived(0.0);
        travelRepository.save(travel);

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId())
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", travel.getPlayerShipId()));

        customsService.inspectOnArrival(travel);

        if (customsService.isAwaitingDecision(travel.getTravelId())) {
            ship.arriveAndAwaitCustoms(travel.getDestinationPortId());
            playerShipRepository.save(ship);
            System.out.println("[TravelArrival] Ship " + ship.getId()
                    + " arrived at port " + travel.getDestinationPortId()
                    + " — BLOCKED, awaiting customs decision");
            return;
        }

        unloadingStartService.startUnloadingImmediately(travel);
        System.out.println("[TravelArrival] Ship " + ship.getId()
                + " arrived at port " + travel.getDestinationPortId()
                + " — customs cleared, unloading started");
    }
}