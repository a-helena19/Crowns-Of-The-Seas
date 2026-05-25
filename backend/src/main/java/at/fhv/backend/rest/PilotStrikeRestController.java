package at.fhv.backend.rest;

import at.fhv.backend.application.services.pilotstrike.PilotStrikeService;
import at.fhv.backend.domain.model.pilotstrike.PilotStrike;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class PilotStrikeRestController {

    private final PilotStrikeService pilotStrikeService;

    public PilotStrikeRestController(PilotStrikeService pilotStrikeService) {
        this.pilotStrikeService = pilotStrikeService;
    }

    @GetMapping("/{sessionId}/pilot-strikes")
    public ResponseEntity<List<PilotStrikeResponse>> getActiveStrikes(@PathVariable UUID sessionId) {
        List<PilotStrikeResponse> strikes = pilotStrikeService.getActiveStrikes(sessionId).stream()
                .map(PilotStrikeResponse::from)
                .toList();
        return ResponseEntity.ok(strikes);
    }

    public record PilotStrikeResponse(UUID portId, String portName, int startTick, int endTick) {
        static PilotStrikeResponse from(PilotStrike strike) {
            return new PilotStrikeResponse(strike.portId(), strike.portName(), strike.startTick(), strike.endTick());
        }
    }
}
