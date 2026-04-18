package at.fhv.backend.application.services.impl.cargo;

import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CargoQueryServiceImpl implements CargoQueryService {
    private final SessionCargoRepository sessionCargoRepository;
    private final CargoRepository cargoRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PortQueryService portQueryService;

    public CargoQueryServiceImpl(SessionCargoRepository sessionCargoRepository, CargoRepository cargoRepository, GameSessionRepository gameSessionRepository, PortQueryService portQueryService) {
        this.sessionCargoRepository = sessionCargoRepository;
        this.cargoRepository = cargoRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.portQueryService = portQueryService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionCargoDTO> getAvailableCargos(UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFoundException(sessionId));
        int currentTick = session.getCurrentTick();
        return sessionCargoRepository.findAvailableBySessionId(sessionId, currentTick)
                .stream()
                .map(sc -> enrichDto(sc))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SessionCargoDTO getCargoById(UUID sessionCargoId) {
        SessionCargo sc = sessionCargoRepository.findById(sessionCargoId).orElseThrow(() -> new CargoNotFoundException("SessionCargo not found:" + sessionCargoId));
        return enrichDto(sc);
    }

    private SessionCargoDTO enrichDto(SessionCargo sc) {
        SessionCargoDTO dto = toDto(sc);

        try {
            PortResponseDTO origin = portQueryService.findById(sc.getOriginPortId());
            dto.setOriginPortName(origin.name());
        } catch (Exception e) {
            dto.setOriginPortName("Unknown");
        }
        try {
            PortResponseDTO dest = portQueryService.findById(sc.getDestinationPortId());
            dto.setDestinationPortName(dest.name());
        } catch (Exception e) {
            dto.setDestinationPortName("Unknown");
        }

        try {
            Cargo template = cargoRepository.findById(sc.getCargoId()).orElse(null);
            if (template != null) {
                dto.setName(template.getName());
                dto.setDescription(template.getDescription());
            }
        } catch (Exception ignored) {}

        return dto;
    }

    private SessionCargoDTO toDto(SessionCargo sc) {
        SessionCargoDTO dto = new SessionCargoDTO();
        dto.setId(sc.getId());
        dto.setCargoId(sc.getCargoId());
        dto.setSessionId(sc.getSessionId());
        dto.setOriginPortId(sc.getOriginPortId());
        dto.setDestinationPortId(sc.getDestinationPortId());
        dto.setReward(sc.getReward());
        dto.setContainsIllegal(sc.isContainsIllegal());
        dto.setCapacity(sc.getCapacity());
        dto.setCargoType(sc.getCargoType());
        dto.setRisk(sc.getRisk());
        dto.setCargoStatus(sc.getCargoStatus());
        dto.setSpawnTick(sc.getSpawnTick());
        return dto;
    }
}
