package at.fhv.backend.application.services.impl.port;

import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import at.fhv.backend.domain.model.port.exception.PortNotFoundException;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
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
