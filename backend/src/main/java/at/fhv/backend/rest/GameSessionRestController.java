package at.fhv.backend.rest;


import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.rest.dtos.session.request.*;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class GameSessionRestController {

    private final GameSessionService gameSessionService;

    public GameSessionRestController(GameSessionService gameSessionService) {
        this.gameSessionService = gameSessionService;
    }

    @PostMapping
    public ResponseEntity<SessionDTO> create(
            HttpServletRequest request,
            @RequestBody CreateSessionRequest req) {
        // Get userId from JWT (set by JwtFilter)
        UUID userId = (UUID) request.getAttribute("userId");

        // Check if userId is present
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);  // or throw exception
        }

        // Parse ISO 8601 duration string (e.g., "PT3600S") to Java Duration
        Duration duration = Duration.parse(req.duration());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gameSessionService.createSession(
                        userId, req.hostName(),
                        req.maxPlayers(), req.tickRateSeconds(), duration));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionDTO> join(
            HttpServletRequest request,
            @RequestBody JoinSessionRequest req) {
        UUID userId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(
                gameSessionService.joinSession(req.gameCode(), userId, req.playerName()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SessionDTO>> getMySessions(
            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("userId"); // kommt vom JwtFilter
        return ResponseEntity.ok(gameSessionService.getActiveSessionsForUser(userId));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<SessionDTO> start(
            HttpServletRequest request,
            @PathVariable UUID id) {
        UUID hostUserId = (UUID) request.getAttribute("userId"); // kommt vom JwtFilter
        return ResponseEntity.ok(gameSessionService.startGame(id, hostUserId));
    }

    @PatchMapping("/{id}/tickrate")
    public ResponseEntity<SessionDTO> changeTickRate(
            HttpServletRequest request,
            @PathVariable UUID id,
            @RequestBody ChangeTickRateRequest req) {
        UUID hostUserId = (UUID) request.getAttribute("userId"); // kommt vom JwtFilter
        return ResponseEntity.ok(
                gameSessionService.changeTickRate(id, hostUserId, req.tickRateSeconds()));
    }

    /* TODO: remove the comment when it is needed in sprint2
    @PatchMapping("/{id}/faction")
    public ResponseEntity<SessionDTO> assignFaction(
            @PathVariable UUID id,
            @RequestBody AssignFactionRequest req) {
        return ResponseEntity.ok(
                gameSessionService.assignFaction(id, req.userId(), req.faction()));
    }

     */

}
