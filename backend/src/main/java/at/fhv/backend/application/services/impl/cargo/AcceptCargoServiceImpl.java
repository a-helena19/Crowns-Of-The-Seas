package at.fhv.backend.application.services.impl.cargo;


import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.cargo.AcceptCargoService;
import at.fhv.backend.application.services.port.PortQueryService;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class AcceptCargoServiceImpl implements AcceptCargoService {
    private final SessionCargoRepository sessionCargoRepository;
    private final CargoRepository cargoRepository;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PortQueryService portQueryService;

    public AcceptCargoServiceImpl(SessionCargoRepository sessionCargoRepository, CargoRepository cargoRepository, PlayerShipRepository playerShipRepository,
                                  ShipRepository shipRepository, GameSessionRepository gameSessionRepository, PortQueryService portQueryService) {
        this.sessionCargoRepository = sessionCargoRepository;
        this.cargoRepository = cargoRepository;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.portQueryService = portQueryService;
    }

    @Override
    @Transactional
    public SessionCargoDTO acceptCargo(UUID playerId, UUID sessionId, AcceptCargoRequest request) {
        GameSession session = gameSessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFoundException(sessionId));
        int currentTick = session.getCurrentTick();
        SessionCargo cargo = sessionCargoRepository.findByIdForUpdate(request.getSessionCargoId()).orElseThrow(() -> new CargoNotFoundException("SessionCargo not found for: " + request.getSessionCargoId()));

        if (cargo.getCargoStatus() != CargoStatus.AVAILABLE || !cargo.isVisibleAt(currentTick)) {
            throw new CargoNotAvailableException(request.getSessionCargoId());
        }

        PlayerShip playerShip = playerShipRepository.findByIdAndPlayerIdAndSessionId(request.getPlayerShipId(), playerId, sessionId)
                .orElseThrow(() -> new ShipNotFoundException("PlayerShip", request.getPlayerShipId()));

        Ship ship = shipRepository.findById(playerShip.getShipId()).orElseThrow(() -> new ShipNotFoundException("Ship", playerShip.getShipId()));
        if (ship.getMaxCargoCapacity() < cargo.getCapacity()) {
            throw new CargoCapacityExceededException(cargo.getCapacity(), ship.getMaxCargoCapacity());
        }

        int cooldownTicks = CargoSessionInitializer.cooldownTicksFor(cargo.getCargoType());
        cargo.assign(playerId, playerShip.getId(), cooldownTicks, currentTick);
        sessionCargoRepository.save(cargo);
        return buildDto(cargo);
    }

    private SessionCargoDTO buildDto(SessionCargo sc) {
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

        try {
            PortResponseDTO origin = portQueryService.findById(sc.getOriginPortId());
            dto.setOriginPortName(origin.name());
        } catch (Exception e) { dto.setOriginPortName("Unknown"); }
        try {
            PortResponseDTO dest = portQueryService.findById(sc.getDestinationPortId());
            dto.setDestinationPortName(dest.name());
        } catch (Exception e) { dto.setDestinationPortName("Unknown"); }

        cargoRepository.findById(sc.getCargoId()).ifPresent(t -> {
            dto.setName(t.getName());
            dto.setDescription(t.getDescription());
        });
        return dto;
    }
}
