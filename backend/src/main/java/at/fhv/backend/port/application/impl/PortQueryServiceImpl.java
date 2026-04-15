package at.fhv.backend.port.application.impl;

import at.fhv.backend.port.application.PortQueryService;
import at.fhv.backend.port.application.dto.PortResponseDTO;
import at.fhv.backend.port.domain.exception.PortNotFoundException;
import at.fhv.backend.port.domain.model.Port;
import at.fhv.backend.port.domain.model.PortId;
import at.fhv.backend.port.domain.repository.PortRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PortQueryServiceImpl implements PortQueryService {

    private final PortRepository portRepository;

    public PortQueryServiceImpl(PortRepository portRepository) {
        this.portRepository = portRepository;
    }

    @Override
    public List<PortResponseDTO> findAll() {
        return portRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PortResponseDTO findById(UUID id) {
        Port port = portRepository.findById(PortId.of(id))
                .orElseThrow(() -> new PortNotFoundException(PortId.of(id)));
        return toDTO(port);
    }

    private PortResponseDTO toDTO(Port port) {
        return new PortResponseDTO(
                port.getId().getValue(),
                port.getName(),
                port.getCoordinates().getX(),
                port.getCoordinates().getY()
        );
    }
}
