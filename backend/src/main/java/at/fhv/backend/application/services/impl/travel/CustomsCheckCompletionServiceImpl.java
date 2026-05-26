package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.application.services.travel.CustomsCheckCompletionService;
import at.fhv.backend.application.services.travel.UnloadingStartService;
import at.fhv.backend.domain.model.exception.TravelNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomsCheckCompletionServiceImpl implements CustomsCheckCompletionService {
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final CustomsService customsService;
    private final UnloadingStartService unloadingStartService;

    public CustomsCheckCompletionServiceImpl(TravelRepository travelRepository,
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
    public void completeCustomsCheck(UUID travelId) {
        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new TravelNotFoundException("Travel", travelId));

        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship == null) {
            return;
        }
        if (ship.getStatus() != ShipStatus.CUSTOMS_CHECK) {
            return;
        }

        customsService.inspectOnArrival(travel);

        if (customsService.isAwaitingDecision(travel.getTravelId())) {
            ship.completeCustomsCheckAndAwaitDecision();
            playerShipRepository.save(ship);
            System.out.println("[CustomsCheck] Ship " + ship.getId()
                    + " — 2-tick customs check ended, illegal cargo DETECTED — now BLOCKED");
            return;
        }

        unloadingStartService.startUnloadingAfterCustomsCheck(travel.getTravelId());
        System.out.println("[CustomsCheck] Ship " + ship.getId() + " — 2-tick customs check ended, cleared — unloading started");
    }
}

