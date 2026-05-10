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

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;

    public RepairShipServiceImpl(PlayerShipRepository playerShipRepository,
                                 ShipRepository shipRepository,
                                 SessionPlayerRepository sessionPlayerRepository,
                                 GameTickScheduler gameTickScheduler) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.gameTickScheduler = gameTickScheduler;
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
        double repairCostRaw = repairNeededPercent / 100.0 * ship.getOperatingCost().doubleValue() * REPAIR_PRICE_FACTOR;
        BigDecimal totalCost = BigDecimal.valueOf(repairCostRaw).setScale(2, RoundingMode.HALF_UP);

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        if (player.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException(totalCost, player.getBalance());
        }

        playerShip.applyRepair(repairNeededPercent);
        playerShipRepository.save(playerShip);

        player.subtractBalance(totalCost);
        sessionPlayerRepository.save(player);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);

        return new RepairResponseDTO(playerShip.getCondition(), totalCost, player.getBalance());
    }
}
