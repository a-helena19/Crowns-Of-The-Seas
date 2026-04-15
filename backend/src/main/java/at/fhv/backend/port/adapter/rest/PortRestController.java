package at.fhv.backend.port.adapter.rest;

import at.fhv.backend.port.application.PortQueryService;
import at.fhv.backend.port.application.dto.PortResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ports")
public class PortRestController {

    private final PortQueryService portQueryService;

    public PortRestController(PortQueryService portQueryService) {
        this.portQueryService = portQueryService;
    }

    @GetMapping
    public ResponseEntity<List<PortResponseDTO>> getAllPorts() {
        return ResponseEntity.ok(portQueryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortResponseDTO> getPortById(@PathVariable UUID id) {
        return ResponseEntity.ok(portQueryService.findById(id));
    }
}
