package at.fhv.backend.rest;


import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.player.exception.FactionAlreadyAssignedException;
import at.fhv.backend.domain.model.player.exception.InvalidFactionException;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.rest.dtos.session.request.*;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
        UUID userId = (UUID) request.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);  // or throw exception
        }

        // Parse ISO 8601 duration string (e.g., "PT3600S") to Java Duration
        Duration duration = Duration.parse(req.duration());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gameSessionService.createSession(
                        userId, req.hostName(),
                        req.maxPlayers(), req.tickRateSeconds(), req.totalTicks(), duration));
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

    @PostMapping("/{id}/leave")
    public ResponseEntity<SessionDTO> leave(
            HttpServletRequest request,
            @PathVariable UUID id) {
        UUID userId = (UUID) request.getAttribute("userId");
        return ResponseEntity.ok(gameSessionService.leaveSession(id, userId));
    }

    /**
     * Weist einem Spieler in einer Session eine Faction zu.
     */
    @PostMapping("/{sessionId}/players/{userId}/faction")
    public ResponseEntity<?> assignPlayerFaction(
            @PathVariable UUID sessionId,
            @PathVariable UUID userId,
            @RequestBody AssignFactionRequest request) {

        try {
            gameSessionService.assignPlayerFaction(sessionId, userId, request.faction());
            return ResponseEntity.ok().build();
        } catch (SessionNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (PlayerNotFoundException e) {
            return ResponseEntity.badRequest().body("Player not found in session");
        } catch (FactionAlreadyAssignedException e) {
            return ResponseEntity.badRequest().body("Faction already assigned");
        } catch (InvalidFactionException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{sessionId}/players/{userId}/faction")
    public ResponseEntity<?> getPlayerFaction(
            @PathVariable UUID sessionId,
            @PathVariable UUID userId) {

        Optional<PlayerFaction> faction = gameSessionService.getPlayerFaction(sessionId, userId);
        if (faction.isPresent()) {
            return ResponseEntity.ok(Map.of("faction", faction.get()));
        } else {
            return ResponseEntity.ok(Map.of("faction", (String) null));
        }
    }

}
