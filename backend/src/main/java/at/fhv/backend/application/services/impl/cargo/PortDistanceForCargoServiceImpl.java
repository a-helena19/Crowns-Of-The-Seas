package at.fhv.backend.application.services.impl.cargo;

import at.fhv.backend.application.services.cargo.PortDistanceForCargoService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.port.exception.PortNotFoundException;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PortDistanceForCargoServiceImpl implements PortDistanceForCargoService {
    private final PortQueryService portQueryService;

    public PortDistanceForCargoServiceImpl(PortQueryService portQueryService) {
        this.portQueryService = portQueryService;
    }

    @Override
    public double distanceBetween(UUID originPortId, UUID destinationPortId) {
        PortResponseDTO origin = portQueryService.findById(originPortId);
        PortResponseDTO destination = portQueryService.findById(destinationPortId);
        return Coordinates.of(origin.x(), origin.y())
                .distanceTo(Coordinates.of(destination.x(), destination.y()));
    }
}
