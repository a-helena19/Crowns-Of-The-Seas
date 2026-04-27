package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.CargoUnloadService;
import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.application.services.travel.TravelArrivalService;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.domain.model.travel.TravelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class TravelArrivalServiceImpl implements TravelArrivalService {
    private final TravelRepository travelRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final CargoUnloadService cargoUnloadService;
    private final RewardCalculationService rewardCalculationService;

    public TravelArrivalServiceImpl(TravelRepository travelRepository,
                                    PlayerShipRepository playerShipRepository,
                                    GameSessionRepository gameSessionRepository,
                                    CargoUnloadService cargoUnloadService,
                                    RewardCalculationService rewardCalculationService) {
        this.travelRepository = travelRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.cargoUnloadService = cargoUnloadService;
        this.rewardCalculationService = rewardCalculationService;
    }

    @Override
    @Transactional
    public void handleArrival(Travel travel) {
        // 1. Mark travel as arrived
        travel.markAsArrived(0.0, travel.getTravelStatus());
        travelRepository.save(travel);

        // 2. Update ship status
        PlayerShip ship = playerShipRepository.findById(travel.getPlayerShipId()).orElse(null);
        if (ship != null) {
            ship.arriveAtPort(travel.getDestinationPortId());
            playerShipRepository.save(ship);
        }

        // 3. Unload all cargo for this travel
        cargoUnloadService.unloadCargoForTravel(travel);

        // 4. Calculate and distribute rewards
        UUID playerId = travel.getPlayerId();
        BigDecimal totalReward = rewardCalculationService.calculateTotalReward(travel);

        if (totalReward.compareTo(BigDecimal.ZERO) > 0) {
            var session = gameSessionRepository.findById(travel.getSessionId()).orElse(null);
            if (session != null) {
                ISessionPlayer player = session.getPlayers().stream()
                        .filter(p -> p.getUserId().equals(playerId))
                        .findFirst()
                        .orElse(null);

                if (player != null) {
                    player.addBalance(totalReward);
                    gameSessionRepository.save(session);
                }
            }
        }
    }
}
