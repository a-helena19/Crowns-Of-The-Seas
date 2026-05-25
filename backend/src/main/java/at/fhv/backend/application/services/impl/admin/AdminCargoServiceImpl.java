package at.fhv.backend.application.services.impl.admin;

import at.fhv.backend.application.dtos.mapper.AdminCargoDTOMapper;
import at.fhv.backend.application.services.admin.AdminCargoService;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminCargoServiceImpl implements AdminCargoService {

    private final CargoRepository cargoRepository;
    private final AdminCargoDTOMapper mapper;

    public AdminCargoServiceImpl(CargoRepository cargoRepository, AdminCargoDTOMapper mapper) {
        this.cargoRepository = cargoRepository;
        this.mapper = mapper;
    }

    @Override
    public List<AdminCargoDTO> getAllCargos() {
        return cargoRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AdminCargoDTO createCargo(AdminCargoDTO dto) {
        Cargo cargo = mapper.toDomain(dto);
        Cargo saved = cargoRepository.save(cargo);
        return mapper.toResponse(saved);
    }

    @Override
    public AdminCargoDTO updateCargo(UUID id, AdminCargoDTO dto) {
        cargoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cargo not found"));

        Cargo updated = mapper.toDomainWithId(
                new AdminCargoDTO(id, dto.name(), dto.description(),
                        dto.baseReward(), dto.capacity(), dto.cargoType(), dto.risk())
        );
        Cargo saved = cargoRepository.save(updated);
        return mapper.toResponse(saved);
    }

    @Override
    public void deleteCargo(UUID id) {
        cargoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cargo not found"));
        cargoRepository.deleteById(id);
    }
}