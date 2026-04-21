package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.application.services.travel.FuelEstimateService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.ship.response.FuelEstimateDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;


@Service
public class FuelEstimateServiceImpl implements FuelEstimateService {
    private static final double[] SPEED_SETTINGS = {0.5, 0.625, 0.75, 0.875, 1.0};
    private static final String[] SPEED_LABELS   = {"Langsam", "Gemütlich", "Normal", "Schnell", "Volldampf"};

    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortDistanceForCargoService portDistanceService;
    private final CalculateFuelConsumptionService calculateFuelConsumptionService;

    public FuelEstimateServiceImpl(PlayerShipRepository playerShipRepository,
                                   ShipRepository shipRepository,
                                   SessionCargoRepository sessionCargoRepository,
                                   PortDistanceForCargoService portDistanceService,
                                   CalculateFuelConsumptionService calculateFuelConsumptionService) {
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.portDistanceService = portDistanceService;
        this.calculateFuelConsumptionService = calculateFuelConsumptionService;
    }

    @Override
    @Transactional(readOnly = true)
    public FuelEstimateDTO estimate(UUID playerId, UUID sessionId, UUID playerShipId, UUID sessionCargoId) {
        PlayerShip playerShip = playerShipRepository
                .findByIdAndPlayerIdAndSessionId(playerShipId, playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", playerShipId));

        Ship ship = shipRepository.findById(playerShip.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));

        SessionCargo cargo = sessionCargoRepository.findById(sessionCargoId)
                .orElseThrow(() -> new CargoNotFoundException(sessionCargoId));

        double distance = portDistanceService.distanceBetween(
                playerShip.getCurrentPortId(),
                cargo.getDestinationPortId()
        );

        double maxFuel = ship.getMaxFuel().doubleValue();
        double baseFuelAbsolute = calculateFuelConsumptionService.calculateFuelConsumption(ship, distance);
        double availableFuelAbsolute = (playerShip.getFuel() / 100.0) * maxFuel;

        List<FuelEstimateDTO.SpeedOption> options = new ArrayList<>();
        for (int i = 0; i < SPEED_SETTINGS.length; i++) {
            double speedSetting = SPEED_SETTINGS[i];
            double multiplier = 0.5 + speedSetting;
            double requiredAbsolute = baseFuelAbsolute * multiplier;
            double requiredPercent = (requiredAbsolute / maxFuel) * 100.0;

            boolean possible = requiredAbsolute <= maxFuel;
            boolean affordable = availableFuelAbsolute >= requiredAbsolute;

            options.add(new FuelEstimateDTO.SpeedOption(
                    speedSetting, SPEED_LABELS[i],
                    requiredAbsolute, requiredPercent,
                    affordable, possible
            ));
        }

        return new FuelEstimateDTO(
                playerShip.getFuel(),
                availableFuelAbsolute,
                maxFuel,
                distance,
                options
        );
    }
}
