package at.fhv.backend.rest;

import at.fhv.backend.application.services.admin.AdminCargoService;
import at.fhv.backend.application.services.admin.AdminShipService;
import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminRestController {

    private final AdminShipService adminShipService;
    private final AdminCargoService adminCargoService;

    public AdminRestController(AdminShipService adminShipService,
                               AdminCargoService adminCargoService) {
        this.adminShipService = adminShipService;
        this.adminCargoService = adminCargoService;
    }

    private void requireAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }


    @GetMapping("/ships")
    public ResponseEntity<List<AdminShipDTO>> getAllShips(HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.ok(adminShipService.getAllShips());
    }

    @PostMapping("/ships")
    public ResponseEntity<AdminShipDTO> createShip(@RequestBody AdminShipDTO dto,
                                                   HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminShipService.createShip(dto));
    }

    @PutMapping("/ships/{id}")
    public ResponseEntity<AdminShipDTO> updateShip(@PathVariable UUID id,
                                                   @RequestBody AdminShipDTO dto,
                                                   HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.ok(adminShipService.updateShip(id, dto));
    }

    @DeleteMapping("/ships/{id}")
    public ResponseEntity<Void> deleteShip(@PathVariable UUID id, HttpServletRequest req) {
        requireAdmin(req);
        adminShipService.deleteShip(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/cargos")
    public ResponseEntity<List<AdminCargoDTO>> getAllCargos(HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.ok(adminCargoService.getAllCargos());
    }

    @PostMapping("/cargos")
    public ResponseEntity<AdminCargoDTO> createCargo(@RequestBody AdminCargoDTO dto,
                                                     HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCargoService.createCargo(dto));
    }

    @PutMapping("/cargos/{id}")
    public ResponseEntity<AdminCargoDTO> updateCargo(@PathVariable UUID id,
                                                     @RequestBody AdminCargoDTO dto,
                                                     HttpServletRequest req) {
        requireAdmin(req);
        return ResponseEntity.ok(adminCargoService.updateCargo(id, dto));
    }

    @DeleteMapping("/cargos/{id}")
    public ResponseEntity<Void> deleteCargo(@PathVariable UUID id, HttpServletRequest req) {
        requireAdmin(req);
        adminCargoService.deleteCargo(id);
        return ResponseEntity.noContent().build();
    }
}