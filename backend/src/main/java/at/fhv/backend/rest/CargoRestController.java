package at.fhv.backend.rest;

import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cargo")
public class CargoRestController {
    private final CargoQueryService cargoQueryService;

    public CargoRestController(CargoQueryService cargoQueryService) {
        this.cargoQueryService = cargoQueryService;
    }

    @GetMapping("/{sessionId}/available")
    public ResponseEntity<List<SessionCargoDTO>> getAvailable(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cargoQueryService.getAvailableCargos(sessionId));
    }

    @GetMapping("/offer/{sessionCargoId}")
    public ResponseEntity<SessionCargoDTO> getById(@PathVariable UUID sessionCargoId) {
        return ResponseEntity.ok(cargoQueryService.getCargoById(sessionCargoId));
    }
}
