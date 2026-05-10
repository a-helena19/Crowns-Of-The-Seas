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

    private static final double FUEL_PRICE_PER_UNIT = 3.0;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final GameTickScheduler gameTickScheduler;

    public RefuelShipServiceImpl(PlayerShipRepository playerShipRepository,
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
    public RefuelResponseDTO refuel(UUID playerShipId, UUID playerId, UUID sessionId) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotOwnedException("Ship not found or not owned by player", playerShipId));

        if (playerShip.getStatus() != ShipStatus.AT_PORT) {
            throw new InvalidShipStatusTransition("Ship must be AT_PORT to refuel", "playerShipId", playerShipId);
        }

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("shipId", playerShip.getShipId()));

        double fuelNeededPercent = 100.0 - playerShip.getFuel();
        double fuelNeededAbsolute = fuelNeededPercent / 100.0 * ship.getMaxFuel().doubleValue();
        BigDecimal totalCost = BigDecimal.valueOf(fuelNeededAbsolute * FUEL_PRICE_PER_UNIT)
                .setScale(2, RoundingMode.HALF_UP);

        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        if (player.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException(totalCost, player.getBalance());
        }

        playerShip.addFuel(fuelNeededPercent);
        playerShipRepository.save(playerShip);

        player.subtractBalance(totalCost);
        sessionPlayerRepository.save(player);

        gameTickScheduler.triggerImmediateBroadcast(sessionId);

        return new RefuelResponseDTO(playerShip.getFuel(), totalCost, player.getBalance());
    }
}
