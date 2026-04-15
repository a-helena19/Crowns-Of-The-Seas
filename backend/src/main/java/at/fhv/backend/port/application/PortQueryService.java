package at.fhv.backend.port.application;

import at.fhv.backend.port.application.dto.PortResponseDTO;

import java.util.List;
import java.util.UUID;

public interface PortQueryService {
    List<PortResponseDTO> findAll();
    PortResponseDTO findById(UUID id);
}
