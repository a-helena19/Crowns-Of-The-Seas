package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class AdminCargoDTOMapperTest {

    private final AdminCargoDTOMapper mapper = new AdminCargoDTOMapper();

    private Cargo buildCargo() {
        return Cargo.create("Electronics Shipment", "Fragile electronics",
                BigDecimal.valueOf(5000), 25,
                CargoType.ELECTRONICS, 0.15);
    }

    @Test
    void givenCargo_whenToResponse_thenAllFieldsMapped() {
        Cargo cargo = buildCargo();

        AdminCargoDTO dto = mapper.toResponse(cargo);

        assertThat(dto.id()).isEqualTo(cargo.getId());
        assertThat(dto.name()).isEqualTo("Electronics Shipment");
        assertThat(dto.description()).isEqualTo("Fragile electronics");
        assertThat(dto.baseReward()).isEqualByComparingTo(BigDecimal.valueOf(5000));
        assertThat(dto.capacity()).isEqualTo(25);
        assertThat(dto.cargoType()).isEqualTo("ELECTRONICS");
        assertThat(dto.risk()).isEqualTo(0.15);
    }

    @Test
    void givenDTO_whenToDomain_thenNewIdIsGenerated() {
        AdminCargoDTO dto = new AdminCargoDTO(
                null, "Food Cargo", "Perishable goods",
                BigDecimal.valueOf(2000), 50,
                "FOOD", 0.3);

        Cargo cargo = mapper.toDomain(dto);

        assertThat(cargo.getId()).isNotNull();
        assertThat(cargo.getName()).isEqualTo("Food Cargo");
        assertThat(cargo.getCargoType()).isEqualTo(CargoType.FOOD);
    }

    @Test
    void givenDTOWithId_whenToDomainWithId_thenIdIsPreserved() {
        UUID fixedId = UUID.randomUUID();
        AdminCargoDTO dto = new AdminCargoDTO(
                fixedId, "Luxury Cargo", "High value",
                BigDecimal.valueOf(15000), 10,
                "LUXURY_GOODS", 0.05);

        Cargo cargo = mapper.toDomainWithId(dto);

        assertThat(cargo.getId()).isEqualTo(fixedId);
        assertThat(cargo.getName()).isEqualTo("Luxury Cargo");
        assertThat(cargo.getCargoType()).isEqualTo(CargoType.LUXURY_GOODS);
    }
}