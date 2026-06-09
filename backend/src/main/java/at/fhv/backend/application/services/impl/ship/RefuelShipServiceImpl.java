package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.ship.RefuelShipService;
import at.fhv.backend.domain.model.exception.InsufficientFundsException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotOwnedException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.domain.model.ship.ShipStatus;
import at.fhv.backend.rest.dtos.ship.response.RefuelResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class RefuelShipServiceImpl implements RefuelShipService {

    private static final double FUEL_PRICE_PER_UNIT = 8.0;
    private static final int BASE_REFUELING_TICKS = 3;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;
    private final GameSessionRepository gameSessionRepository;

    public RefuelShipServiceImpl(PlayerShipRepository playerShipRepository,
                                 ShipRepository shipRepository,
                                 SessionPlayerRepository sessionPlayerRepository,
                                 GameTickScheduler gameTickScheduler,
                                 GameSessionRepository gameSessionRepository) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.gameTickScheduler = gameTickScheduler;
        this.gameSessionRepository = gameSessionRepository;
    }

    @Override
    @Transactional
    public RefuelResponseDTO refuel(UUID playerShipId, UUID playerId, UUID sessionId, double targetFuelPercent) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotOwnedException("Ship not found or not owned by player", playerShipId));

        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be AT_PORT to refuel", "playerShipId", playerShipId);
        }

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));

        double clampedTarget = Math.min(100.0, Math.max(playerShip.getFuel(), targetFuelPercent));
        double fuelNeededPercent = clampedTarget - playerShip.getFuel();
        double fuelNeededAbsolute = fuelNeededPercent / 100.0 * ship.getMaxFuel().doubleValue();

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        double costModifier = player.getFuelCostModifier();
        BigDecimal totalCost = BigDecimal.valueOf(fuelNeededAbsolute * FUEL_PRICE_PER_UNIT * costModifier)
                .setScale(0, java.math.RoundingMode.HALF_UP);

        if (player.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException(totalCost, player.getBalance());
        }

        player.subtractBalance(totalCost);
        sessionPlayerRepository.save(player);

        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : 0;

        double fuelFactor = 1.0 + (fuelNeededPercent / 100.0);
        double timeModifier = player.getFuelTimeModifier();
        int refuelingTicks = (int) Math.ceil(BASE_REFUELING_TICKS * fuelFactor * timeModifier);
        refuelingTicks = Math.max(1, refuelingTicks);
        int completedAtTick = currentTick + refuelingTicks;

        playerShip.startRefueling(completedAtTick, fuelNeededPercent);
        playerShipRepository.save(playerShip);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);

        return new RefuelResponseDTO(
                playerShip.getFuel(),
                totalCost,
                player.getBalance(),
                completedAtTick,
                refuelingTicks
        );
    }
}
