package at.fhv.backend.rest;

import at.fhv.backend.application.dtos.request.StartTravelDTO;
import at.fhv.backend.application.dtos.response.TravelDTO;
import at.fhv.backend.application.services.travel.StartTravelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/travels")
public class TravelRestController {
    private final StartTravelService startTravelService;

    public TravelRestController(StartTravelService startTravelService) {
        this.startTravelService = startTravelService;
    }

    @PostMapping("/start/{playerId}")
    public ResponseEntity<TravelDTO> startTravel(
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId,
            @Valid @RequestBody StartTravelDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(startTravelService.startTravel(playerId, sessionId, request));
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
