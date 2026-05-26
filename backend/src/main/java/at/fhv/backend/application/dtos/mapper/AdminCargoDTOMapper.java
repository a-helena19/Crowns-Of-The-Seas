package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import org.springframework.stereotype.Component;

@Component
public class AdminCargoDTOMapper implements DtoMapper<Cargo, AdminCargoDTO> {

    @Override
    public AdminCargoDTO toResponse(Cargo cargo) {
        return new AdminCargoDTO(
                cargo.getId(),
                cargo.getName(),
                cargo.getDescription(),
                cargo.getBaseReward(),
                cargo.getCapacity(),
                cargo.getCargoType().name(),
                cargo.getRisk()
        );
    }

    public Cargo toDomain(AdminCargoDTO dto) {
        return Cargo.create(
                dto.name(), dto.description(),
                dto.baseReward(), dto.capacity(),
                CargoType.valueOf(dto.cargoType()), dto.risk()
        );
    }

    public Cargo toDomainWithId(AdminCargoDTO dto) {
        return Cargo.reconstruct(
                dto.id(), dto.name(), dto.description(),
                dto.baseReward(), dto.capacity(),
                CargoType.valueOf(dto.cargoType()), dto.risk()
        );
    }
}