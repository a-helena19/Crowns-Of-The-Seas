package at.fhv.backend.application.services.route;

import at.fhv.backend.rest.dtos.route.response.RouteResponseDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteQueryService {
    Optional<RouteResponseDTO> findByPorts(UUID originPortId, UUID destinationPortId);
    List<RouteResponseDTO> findAll();
}
