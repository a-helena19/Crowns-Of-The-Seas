package at.fhv.backend.rest;

import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.application.services.travel.CalculateFuelConsumptionService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.InsufficientFuelException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.rest.dtos.ship.request.FuelEstimateRequest;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.FuelEstimateDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.application.services.travel.StartTravelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/travels")
public class TravelRestController {
    private final StartTravelService startTravelService;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortQueryService portQueryService;
    private final CalculateFuelConsumptionService calculateFuelConsumptionService;

    private static final double[] SPEED_SETTINGS = {0.5, 0.625, 0.75, 0.875, 1.0};
    private static final String[] SPEED_LABELS   = {"Langsam", "Gemütlich", "Normal", "Schnell", "Volldampf"};

    public TravelRestController(StartTravelService startTravelService,
                                PlayerShipRepository playerShipRepository,
                                ShipRepository shipRepository,
                                SessionCargoRepository sessionCargoRepository,
                                PortQueryService portQueryService,
                                CalculateFuelConsumptionService calculateFuelConsumptionService) {
        this.startTravelService = startTravelService;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.portQueryService = portQueryService;
        this.calculateFuelConsumptionService = calculateFuelConsumptionService;
    }

    @PostMapping("/fuel-estimate")
    public ResponseEntity<?> getFuelEstimate(
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId,
            @jakarta.validation.Valid @RequestBody FuelEstimateRequest req) {
        try {
            PlayerShip playerShip = playerShipRepository
                    .findByIdAndPlayerIdAndSessionId(req.getPlayerShipId(), playerId, sessionId)
                    .orElseThrow(() -> new RuntimeException("Ship not found"));
            Ship ship = shipRepository.findById(playerShip.getShipId())
                    .orElseThrow(() -> new RuntimeException("Ship not found"));
            SessionCargo cargo = sessionCargoRepository.findById(req.getSessionCargoId())
                    .orElseThrow(() -> new CargoNotFoundException(req.getSessionCargoId()));

            PortResponseDTO origin = portQueryService.findById(playerShip.getCurrentPortId());
            PortResponseDTO dest   = portQueryService.findById(cargo.getDestinationPortId());
            double dx = origin.x() - dest.x();
            double dy = origin.y() - dest.y();
            double distance = Math.sqrt(dx * dx + dy * dy);

            double maxFuel = ship.getMaxFuel().doubleValue();
            double baseFuelAbsolute = calculateFuelConsumptionService.calculateFuelConsumption(ship, distance);
            double availableFuelAbsolute = (playerShip.getFuel() / 100.0) * maxFuel;

            List<FuelEstimateDTO.SpeedOption> options = new java.util.ArrayList<>();
            for (int i = 0; i < SPEED_SETTINGS.length; i++) {
                double ss = SPEED_SETTINGS[i];
                double multiplier = 0.5 + ss;
                double requiredAbsolute = baseFuelAbsolute * multiplier;
                double requiredPercent  = (requiredAbsolute / maxFuel) * 100.0;
                options.add(new FuelEstimateDTO.SpeedOption(ss, SPEED_LABELS[i], requiredPercent, availableFuelAbsolute >= requiredAbsolute));
            }

            return ResponseEntity.ok(new FuelEstimateDTO(playerShip.getFuel(), maxFuel, distance, options));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/start/{playerId}")
    public ResponseEntity<?> startTravel(
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId,
            @Valid @RequestBody StartTravelDTO request) {
        try {
            TravelDTO result = startTravelService.startTravel(playerId, sessionId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (CargoNotAvailableException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "CARGO_TAKEN", "message", "Diese Fracht wurde gerade von einem anderen Kapitän übernommen."));
        } catch (CargoCapacityExceededException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "CAPACITY_EXCEEDED", "message", "Dein Schiff ist zu klein für diese Fracht."));
        } catch (InsufficientFuelException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "INSUFFICIENT_FUEL",
                            "message", String.format("Nicht genug Treibstoff. Benötigt: %.1f%%, Verfügbar: %.1f%%",
                                    e.getRequiredFuelPercent(), e.getFuel())));
        } catch (CargoNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "CARGO_NOT_FOUND", "message", "Frachtangebot nicht gefunden."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage() != null ? e.getMessage() : "Unbekannter Fehler"));
        }
    }

    @GetMapping("/active/{playerId}")
    public ResponseEntity<List<TravelDTO>> getActiveTravels(@PathVariable UUID playerId) {
        return ResponseEntity.ok(startTravelService.getActiveTravels(playerId));
    }

    @GetMapping("/{travelId}/player/{playerId}")
    public ResponseEntity<TravelDTO> getTravelStatus(@PathVariable UUID travelId, @PathVariable UUID playerId) {
        return ResponseEntity.ok(startTravelService.getTravelStatus(travelId, playerId));
    }
}
