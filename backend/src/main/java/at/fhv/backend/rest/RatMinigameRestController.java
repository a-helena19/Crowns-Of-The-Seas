package at.fhv.backend.rest;

import at.fhv.backend.application.services.minigame.RatMinigameService;
import at.fhv.backend.rest.dtos.minigame.request.RatMinigameResultRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/minigames/rats")
public class RatMinigameRestController {
    private final RatMinigameService ratMinigameService;

    public RatMinigameRestController(RatMinigameService ratMinigameService) {
        this.ratMinigameService = ratMinigameService;
    }

    @PostMapping("/result")
    public ResponseEntity<?> submitResult(@RequestParam UUID playerId,
                                          @RequestParam UUID sessionId,
                                          @Valid @RequestBody RatMinigameResultRequest request) {
        try {
            var result = ratMinigameService.submitResult(playerId, sessionId, request);
            return ResponseEntity.ok(Map.of(
                    "eventType", result.eventType(),
                    "result", result.result(),
                    "hits", result.hits(),
                    "requiredHits", result.requiredHits(),
                    "remainingSeconds", result.remainingSeconds(),
                    "timeLimitSeconds", result.timeLimitSeconds(),
                    "rewardModifier", result.rewardModifier()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "RATS_RESULT_FAILED",
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to submit rat minigame result"
            ));
        }
    }
}
