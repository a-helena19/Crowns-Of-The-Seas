package at.fhv.backend.rest;

import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.rest.exception.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/smuggle")
public class SmuggleRestController {
    private final SmuggleService smuggleService;

    public SmuggleRestController(SmuggleService smuggleService) {
        this.smuggleService = smuggleService;
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptOffer(@RequestParam UUID playerId, @RequestParam UUID sessionId, @RequestParam UUID offerId) {
        try {
            smuggleService.acceptSmuggleOffer(playerId, sessionId, offerId);
            return ResponseEntity.ok(Map.of("accepted", true));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage(), "SMUGGLE_FAILED"));
        }
    }

    @PostMapping("/decline")
    public ResponseEntity<?> declineOffer(@RequestParam UUID playerId, @RequestParam UUID offerId) {
        try {
            smuggleService.declineSmuggleOffer(playerId, offerId);
            return ResponseEntity.ok(Map.of("declined", true));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage(), "SMUGGLE_DECLINE_FAILED"));
        }
    }
}
