package at.fhv.backend.application.services.impl.cargo;

import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.route.Route;
import at.fhv.backend.domain.model.route.RouteRepository;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class PortDistanceForCargoServiceImpl implements PortDistanceForCargoService {
    private final PortQueryService portQueryService;
    private final RouteRepository routeRepository;

    public PortDistanceForCargoServiceImpl(PortQueryService portQueryService, RouteRepository routeRepository) {
        this.portQueryService = portQueryService;
        this.routeRepository = routeRepository;
    }

    @Override
    public double distanceBetween(UUID originPortId, UUID destinationPortId) {
        Optional<Route> route = routeRepository.findByPorts(originPortId, destinationPortId);
        if (route.isPresent()) {
            return route.get().getDistance();
        }

        // Fallback: straight-line distance (used until routes are seeded)
        PortResponseDTO origin = portQueryService.findById(originPortId);
        PortResponseDTO destination = portQueryService.findById(destinationPortId);
        return Coordinates.of(origin.x(), origin.y())
                .distanceTo(Coordinates.of(destination.x(), destination.y()));
    }
}
