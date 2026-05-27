package at.fhv.backend.rest;

import at.fhv.backend.application.services.minigame.StormMinigameService;
import at.fhv.backend.rest.dtos.minigame.request.StormMinigameResultRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/minigames/storm")
public class StormMinigameRestController {
    private final StormMinigameService stormMinigameService;

    public StormMinigameRestController(StormMinigameService stormMinigameService) {
        this.stormMinigameService = stormMinigameService;
    }

    @PostMapping("/result")
    public ResponseEntity<?> submitResult(@RequestParam UUID playerId,
                                          @RequestParam UUID sessionId,
                                          @Valid @RequestBody StormMinigameResultRequest request) {
        try {
            var result = stormMinigameService.submitResult(playerId, sessionId, request);
            return ResponseEntity.ok(Map.of(
                    "eventType", result.eventType(),
                    "result", result.result(),
                    "collectedSuns", result.collectedSuns(),
                    "requiredSuns", result.requiredSuns(),
                    "remainingHealth", result.remainingHealth(),
                    "timeLeftSeconds", result.timeLeftSeconds(),
                    "timeLimitSeconds", result.timeLimitSeconds(),
                    "repairCost", result.repairCost()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "STORM_RESULT_FAILED",
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to submit storm minigame result"
            ));
        }
    }
}
