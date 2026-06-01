package at.fhv.backend.rest;

import at.fhv.backend.application.services.minigame.TreasureHuntMinigameService;
import at.fhv.backend.rest.dtos.minigame.request.TreasureHuntMinigameResultRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/minigames/treasure-hunt")
public class TreasureHuntMinigameRestController {
    private final TreasureHuntMinigameService treasureHuntMinigameService;

    public TreasureHuntMinigameRestController(TreasureHuntMinigameService treasureHuntMinigameService) {
        this.treasureHuntMinigameService = treasureHuntMinigameService;
    }

    @PostMapping("/result")
    public ResponseEntity<?> submitResult(@RequestParam UUID playerId,
                                          @RequestParam UUID sessionId,
                                          @Valid @RequestBody TreasureHuntMinigameResultRequest request) {
        try {
            var result = treasureHuntMinigameService.submitResult(playerId, sessionId, request);
            return ResponseEntity.ok(Map.of(
                    "eventType", result.eventType(),
                    "result", result.result(),
                    "collectedTreasures", result.collectedTreasures(),
                    "requiredTreasures", result.requiredTreasures(),
                    "timeLeftSeconds", result.timeLeftSeconds(),
                    "timeLimitSeconds", result.timeLimitSeconds(),
                    "rewardModifier", result.rewardModifier()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "TREASURE_HUNT_RESULT_FAILED",
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to submit treasure hunt minigame result"
            ));
        }
    }
}
