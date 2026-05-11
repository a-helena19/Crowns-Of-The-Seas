package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.leaderboard.response.LeaderboardEntryDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import at.fhv.backend.application.services.leaderboard.LeaderboardQueryService;


import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardRestController {

    private final LeaderboardQueryService leaderboardQueryService;

    public LeaderboardRestController(LeaderboardQueryService leaderboardQueryService) {
        this.leaderboardQueryService = leaderboardQueryService;
    }

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(@RequestParam UUID sessionId) {
        return ResponseEntity.ok(leaderboardQueryService.getLeaderboard(sessionId));
    }
}
