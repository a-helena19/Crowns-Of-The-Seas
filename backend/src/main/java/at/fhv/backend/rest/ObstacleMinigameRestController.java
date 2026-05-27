package at.fhv.backend.rest;

import at.fhv.backend.application.services.minigame.ObstacleMinigameService;
import at.fhv.backend.rest.dtos.minigame.request.ObstacleMinigameResultRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/minigames/obstacle")
public class ObstacleMinigameRestController {
    private final ObstacleMinigameService obstacleMinigameService;

    public ObstacleMinigameRestController(ObstacleMinigameService obstacleMinigameService) {
        this.obstacleMinigameService = obstacleMinigameService;
    }

    @PostMapping("/result")
    public ResponseEntity<?> submitResult(@RequestParam UUID playerId,
                                          @RequestParam UUID sessionId,
                                          @Valid @RequestBody ObstacleMinigameResultRequest request) {
        try {
            var result = obstacleMinigameService.submitResult(playerId, sessionId, request);
            return ResponseEntity.ok(Map.of(
                    "eventType", result.eventType(),
                    "result", result.result(),
                    "remainingHealth", result.remainingHealth(),
                    "timeLeftSeconds", result.timeLeftSeconds(),
                    "timeLimitSeconds", result.timeLimitSeconds(),
                    "failureReason", result.failureReason() != null ? result.failureReason() : "",
                    "routeViewType", result.routeViewType(),
                    "rewardModifier", result.rewardModifier()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "OBSTACLE_RESULT_FAILED",
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to submit obstacle minigame result"
            ));
        }
    }
}
