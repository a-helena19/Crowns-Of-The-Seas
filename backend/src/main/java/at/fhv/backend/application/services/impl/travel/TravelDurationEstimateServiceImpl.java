package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.travel.TravelDurationEstimateService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.InvalidTravelDataException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.ship.response.TravelDurationEstimateDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TravelDurationEstimateServiceImpl implements TravelDurationEstimateService {

    private static final double[] SPEED_SETTINGS = {0.25, 0.4, 0.6, 0.8, 1.0};
    private static final String[] SPEED_LABELS   = {"Langsam", "Gemütlich", "Normal", "Schnell", "Volldampf"};
    private static final double GLOBAL_TRAVEL_SPEED_FACTOR = 0.75;

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortDistanceForCargoService portDistanceService;

    public TravelDurationEstimateServiceImpl(PlayerShipRepository playerShipRepository,
                                             ShipRepository shipRepository,
                                             SessionCargoRepository sessionCargoRepository,
                                             PortDistanceForCargoService portDistanceService) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.portDistanceService = portDistanceService;
    }

    @Override
    @Transactional(readOnly = true)
    public TravelDurationEstimateDTO estimate(UUID playerId, UUID sessionId,
                                              UUID playerShipId, UUID sessionCargoId) {
        SessionCargo cargo = sessionCargoRepository.findById(sessionCargoId)
                .orElseThrow(() -> new CargoNotFoundException(sessionCargoId));

        return estimateForPort(playerId, sessionId, playerShipId, cargo.getDestinationPortId());
    }

    @Override
    @Transactional(readOnly = true)
    public TravelDurationEstimateDTO estimateForPort(UUID playerId, UUID sessionId,
                                                     UUID playerShipId, UUID destinationPortId) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", playerShipId));

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));

        if (playerShip.getCurrentPortId() == null) {
            throw new InvalidTravelDataException(
                    "Schiff ist aktuell nicht im Hafen. Reisedauer-Schätzung nur für Schiffe am Hafen möglich.",
                    "currentPortId",
                    playerShip.getId()
            );
        }

        double distance = portDistanceService.distanceBetween(
                playerShip.getCurrentPortId(),
                destinationPortId
        );

        List<TravelDurationEstimateDTO.SpeedDurationOption> options = new ArrayList<>();
        for (int i = 0; i < SPEED_SETTINGS.length; i++) {
            double speedSetting = SPEED_SETTINGS[i];
            double effectiveSpeed = ship.getMaxSpeed() * speedSetting * GLOBAL_TRAVEL_SPEED_FACTOR;
            int durationTicks = (int) Math.ceil(distance / Math.max(effectiveSpeed, 0.01));
            options.add(new TravelDurationEstimateDTO.SpeedDurationOption(
                    speedSetting, SPEED_LABELS[i], durationTicks
            ));
        }

        return new TravelDurationEstimateDTO(options);
    }
}
