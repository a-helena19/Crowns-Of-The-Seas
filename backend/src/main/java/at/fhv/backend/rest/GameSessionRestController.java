package at.fhv.backend.rest;


import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.rest.dtos.session.request.*;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
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
            @RequestBody CreateSessionRequest req) {
        // Parse ISO 8601 duration string (e.g., "PT3600S") to Java Duration
        Duration duration = Duration.parse(req.duration());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gameSessionService.createSession(
                        req.hostUserId(), req.hostName(),
                        req.maxPlayers(), req.tickRateSeconds(), duration));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionDTO> join(
            @RequestBody JoinSessionRequest req) {
        return ResponseEntity.ok(
                gameSessionService.joinSession(req.gameCode(), req.userId(), req.playerName()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<SessionDTO> start(
            @PathVariable UUID id,
            @RequestBody StartGameRequest req) {
        return ResponseEntity.ok(gameSessionService.startGame(id, req.hostUserId()));
    }

    @PatchMapping("/{id}/tickrate")
    public ResponseEntity<SessionDTO> changeTickRate(
            @PathVariable UUID id,
            @RequestBody ChangeTickRateRequest req) {
        return ResponseEntity.ok(
                gameSessionService.changeTickRate(id, req.hostUserId(), req.tickRateSeconds()));
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
