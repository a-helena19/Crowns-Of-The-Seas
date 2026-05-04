package at.fhv.backend.application.services.impl.route;


import at.fhv.backend.application.services.route.RouteQueryService;
import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.route.Route;
import at.fhv.backend.domain.model.route.RouteRepository;
import at.fhv.backend.rest.dtos.route.response.RouteResponseDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RouteQueryServiceImpl implements RouteQueryService {
    private final RouteRepository routeRepository;

    public RouteQueryServiceImpl(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @Override
    public Optional<RouteResponseDTO> findByPorts(UUID originPortId, UUID destinationPortId) {
        return routeRepository.findByPorts(originPortId, destinationPortId).map(this::toDTO);
    }

    @Override
    public List<RouteResponseDTO> findAll() {
        return routeRepository.findAll().stream().map(this::toDTO).toList();
    }

    private RouteResponseDTO toDTO(Route route) {
        List<RouteResponseDTO.WaypointDTO> wps = new ArrayList<>();
        for (Coordinates c : route.getWaypoints()) {
            wps.add(new RouteResponseDTO.WaypointDTO(c.getX(), c.getY()));
        }
        return new RouteResponseDTO(
                route.getId().getValue(),
                route.getOriginPortId(),
                route.getDestinationPortId(),
                wps,
                route.getDistance()
        );
    }
}
