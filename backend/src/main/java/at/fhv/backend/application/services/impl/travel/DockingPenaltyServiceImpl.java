package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.DockingPenaltyService;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class DockingPenaltyServiceImpl implements DockingPenaltyService {

    private static final BigDecimal DOCKING_FINE = new BigDecimal("300");
    private static final double DOCKING_WEAR_PERCENT = 10.0;

    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;

    public DockingPenaltyServiceImpl(TravelRepository travelRepository,
                                     PlayerShipRepository playerShipRepository) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
    }

    @Override
    @Transactional
    public void applyArrivalFailurePenalty(UUID travelId, UUID playerId, UUID sessionId) {
        Travel travel = loadAndVerifyTravel(travelId, playerId);
        applyWear(travel.getPlayerShipId());
        travel.markDockingFailure(DOCKING_FINE);
        travelRepository.save(travel);
    }

    @Override
    @Transactional
    public void applyDepartureFailurePenalty(UUID travelId, UUID playerId, UUID sessionId) {
        Travel travel = loadAndVerifyTravel(travelId, playerId);
        applyWear(travel.getPlayerShipId());
        travel.markDepartureDockingFailure(DOCKING_FINE);
        travelRepository.save(travel);
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
