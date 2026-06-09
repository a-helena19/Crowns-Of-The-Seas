package at.fhv.backend.application.services.impl.ship;

import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.ship.RepairShipService;
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
import at.fhv.backend.rest.dtos.ship.response.RepairResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class RepairShipServiceImpl implements RepairShipService {

    private static final double REPAIR_PRICE_FACTOR = 50.0;
    private static final int BASE_REPAIRING_TICKS = 4;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;
    private final GameSessionRepository gameSessionRepository;

    public RepairShipServiceImpl(PlayerShipRepository playerShipRepository,
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
    public RepairResponseDTO repair(UUID playerShipId, UUID playerId, UUID sessionId) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotOwnedException("Ship not found or not owned by player", playerShipId));

        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be AT_PORT to repair", "playerShipId", playerShipId);
        }

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));

        double repairNeededPercent = 100.0 - playerShip.getCondition();

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        double costModifier = player.getRepairCostModifier();
        double repairCostRaw = repairNeededPercent / 100.0 * ship.getOperatingCost().doubleValue() * REPAIR_PRICE_FACTOR;
        BigDecimal totalCost = BigDecimal.valueOf(repairCostRaw * costModifier)
                .setScale(0, java.math.RoundingMode.HALF_UP);

        if (player.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException(totalCost, player.getBalance());
        }

        player.subtractBalance(totalCost);
        sessionPlayerRepository.save(player);

        GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
        int currentTick = session != null ? session.getCurrentTick() : 0;

        double repairFactor = 1.0 + (repairNeededPercent / 100.0);
        double timeModifier = player.getRepairTimeModifier();
        int repairingTicks = (int) Math.ceil(BASE_REPAIRING_TICKS * repairFactor * timeModifier);
        repairingTicks = Math.max(1, repairingTicks);
        int completedAtTick = currentTick + repairingTicks;

        playerShip.startRepairing(completedAtTick, repairNeededPercent);
        playerShipRepository.save(playerShip);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);

        return new RepairResponseDTO(
                playerShip.getCondition(),
                totalCost,
                player.getBalance(),
                completedAtTick,
                repairingTicks
        );
    }
}
