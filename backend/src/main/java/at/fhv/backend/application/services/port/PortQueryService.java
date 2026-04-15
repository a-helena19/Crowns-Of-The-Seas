package at.fhv.backend.application.services.port;

import at.fhv.backend.rest.dtos.port.PortResponseDTO;

import java.util.List;
import java.util.UUID;

public interface PortQueryService {
    List<PortResponseDTO> findAll();
    PortResponseDTO findById(UUID id);
}
