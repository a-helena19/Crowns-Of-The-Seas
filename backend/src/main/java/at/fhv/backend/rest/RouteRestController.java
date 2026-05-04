package at.fhv.backend.rest;

import at.fhv.backend.application.services.route.RouteQueryService;
import at.fhv.backend.rest.dtos.route.response.RouteResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
public class RouteRestController {

    private final RouteQueryService routeQueryService;

    public RouteRestController(RouteQueryService routeQueryService) {
        this.routeQueryService = routeQueryService;
    }

    @GetMapping
    public ResponseEntity<List<RouteResponseDTO>> getAll() {
        return ResponseEntity.ok(routeQueryService.findAll());
    }

    @GetMapping("/{originPortId}/{destinationPortId}")
    public ResponseEntity<RouteResponseDTO> getByPorts(
            @PathVariable UUID originPortId,
            @PathVariable UUID destinationPortId) {
        return routeQueryService.findByPorts(originPortId, destinationPortId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
