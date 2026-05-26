package at.fhv.backend.application.services.impl.admin;

import at.fhv.backend.application.dtos.mapper.AdminShipDTOMapper;
import at.fhv.backend.application.services.admin.AdminShipService;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminShipServiceImpl implements AdminShipService {

    private final ShipRepository shipRepository;
    private final AdminShipDTOMapper mapper;

    public AdminShipServiceImpl(ShipRepository shipRepository, AdminShipDTOMapper mapper) {
        this.shipRepository = shipRepository;
        this.mapper = mapper;
    }

    @Override
    public List<AdminShipDTO> getAllShips() {
        return shipRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AdminShipDTO createShip(AdminShipDTO dto) {
        Ship ship = mapper.toDomain(dto);
        Ship saved = shipRepository.save(ship);
        return mapper.toResponse(saved);
    }

    @Override
    public AdminShipDTO updateShip(UUID id, AdminShipDTO dto) {
        shipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ship not found"));

        Ship updated = mapper.toDomainWithId(
                new AdminShipDTO(id, dto.name(), dto.description(), dto.shipClass(),
                        dto.price(), dto.maxCargoCapacity(), dto.maxSpeed(),
                        dto.fuelConsumption(), dto.maxFuel(), dto.operatingCost(),
                        dto.baseReliability(), dto.iconUrl(), dto.stock())
        );
        Ship saved = shipRepository.save(updated);
        return mapper.toResponse(saved);
    }

    @Override
    public void deleteShip(UUID id) {
        shipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ship not found"));
        shipRepository.deleteById(id);
    }
}