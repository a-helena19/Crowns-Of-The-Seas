package at.fhv.backend.rest;

import at.fhv.backend.application.services.travel.FuelEstimateService;
import at.fhv.backend.application.services.travel.TravelDurationEstimateService;
import at.fhv.backend.application.services.travel.DockingPenaltyService;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.InsufficientFuelException;
import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import at.fhv.backend.domain.model.player.exception.InsufficientBalanceException;
import at.fhv.backend.domain.model.exception.InvalidTravelDataException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.rest.dtos.ship.request.FuelEstimateRequest;
import at.fhv.backend.rest.dtos.ship.request.StartTravelDTO;
import at.fhv.backend.rest.dtos.ship.response.FuelEstimateDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDTO;
import at.fhv.backend.rest.dtos.ship.response.TravelDurationEstimateDTO;
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
    private final FuelEstimateService fuelEstimateService;
    private final TravelDurationEstimateService travelDurationEstimateService;
    private final DockingPenaltyService dockingPenaltyService;

    public TravelRestController(StartTravelService startTravelService,
                                FuelEstimateService fuelEstimateService,
                                TravelDurationEstimateService travelDurationEstimateService,
                                DockingPenaltyService dockingPenaltyService) {
        this.startTravelService = startTravelService;
        this.fuelEstimateService = fuelEstimateService;
        this.travelDurationEstimateService = travelDurationEstimateService;
        this.dockingPenaltyService = dockingPenaltyService;
    }

    @PostMapping("/fuel-estimate")
    public ResponseEntity<?> getFuelEstimate(
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId,
            @Valid @RequestBody FuelEstimateRequest req) {
        try {
            FuelEstimateDTO result = fuelEstimateService.estimate(
                    playerId, sessionId, req.getPlayerShipId(), req.getSessionCargoId()
            );
            return ResponseEntity.ok(result);
        } catch (ShipNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "SHIP_NOT_FOUND", "message", e.getMessage()));
        } catch (CargoNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "CARGO_NOT_FOUND", "message", e.getMessage()));
        } catch (InvalidTravelDataException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "TRAVEL_INVALID_DATA", "message", e.getMessage()));
        }
    }

    @PostMapping("/duration-estimate")
    public ResponseEntity<?> getDurationEstimate(
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId,
            @Valid @RequestBody FuelEstimateRequest req) {
        try {
            TravelDurationEstimateDTO result = travelDurationEstimateService.estimate(
                    playerId, sessionId, req.getPlayerShipId(), req.getSessionCargoId()
            );
            return ResponseEntity.ok(result);
        } catch (ShipNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "SHIP_NOT_FOUND", "message", e.getMessage()));
        } catch (CargoNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "CARGO_NOT_FOUND", "message", e.getMessage()));
        } catch (InvalidTravelDataException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "TRAVEL_INVALID_DATA", "message", e.getMessage()));
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
        } catch (InsufficientBalanceException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "INSUFFICIENT_BALANCE", "message", "Nicht genug Taler für den Lotsendienst (600 Taler)."));
        } catch (InvalidShipStatusTransition e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "SHIP_NOT_READY", "message", "Schiff wird noch beladen. Bitte kurz warten."));
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

    @PostMapping("/{travelId}/docking-failed")
    public ResponseEntity<?> reportDockingFailure(
            @PathVariable UUID travelId,
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId) {
        try {
            dockingPenaltyService.applyArrivalFailurePenalty(travelId, playerId, sessionId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "FORBIDDEN", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }
}
