package at.fhv.backend.rest;

import at.fhv.backend.application.services.cargo.CustomsService;
import at.fhv.backend.rest.exception.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customs")
public class CustomsRestController {
    private final CustomsService customsService;

    public CustomsRestController(CustomsService customsService) {
        this.customsService = customsService;
    }

    @PostMapping("/cooperate")
    public ResponseEntity<?> cooperate(@RequestParam UUID playerId, @RequestParam UUID inspectionId) {
        try {
            customsService.cooperate(playerId, inspectionId);
            return ResponseEntity.ok(Map.of("cooperated", true));
        } catch (Exception exception) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(exception.getMessage(), "CUSTOMS_COOPERATE_FAILED"));
        }
    }

    @PostMapping("/bribe")
    public ResponseEntity<?> bribe(@RequestParam UUID playerId, @RequestParam UUID inspectionId) {
        try {
            customsService.bribe(playerId, inspectionId);
            return ResponseEntity.ok(Map.of("bribed", true));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage(), "CUSTOMS_BRIBE_FAILED"));
        }
    }
}