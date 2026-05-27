package at.fhv.backend.application.services.admin;

import at.fhv.backend.application.dtos.mapper.AdminCargoDTOMapper;
import at.fhv.backend.application.services.impl.admin.AdminCargoServiceImpl;
import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCargoServiceImplTest {

    @Mock private CargoRepository cargoRepository;
    @Mock private AdminCargoDTOMapper mapper;

    private AdminCargoServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminCargoServiceImpl(cargoRepository, mapper);
    }

    private Cargo buildCargo() {
        return Cargo.create("Test Cargo", "desc",
                BigDecimal.valueOf(3000), 20,
                CargoType.GENERAL_GOODS, 0.1);
    }

    private AdminCargoDTO buildDTO(UUID id) {
        return new AdminCargoDTO(id, "Test Cargo", "desc",
                BigDecimal.valueOf(3000), 20,
                "GENERAL_GOODS", 0.1);
    }

    // ── getAllCargos ──

    @Test
    void givenCargosExist_whenGetAll_thenReturnsMappedList() {
        Cargo cargo1 = buildCargo();
        Cargo cargo2 = buildCargo();

        when(cargoRepository.findAll()).thenReturn(List.of(cargo1, cargo2));
        when(mapper.toResponse(cargo1)).thenReturn(buildDTO(cargo1.getId()));
        when(mapper.toResponse(cargo2)).thenReturn(buildDTO(cargo2.getId()));

        List<AdminCargoDTO> result = service.getAllCargos();

        assertThat(result).hasSize(2);
        verify(cargoRepository).findAll();
    }

    @Test
    void givenNoCargos_whenGetAll_thenReturnsEmptyList() {
        when(cargoRepository.findAll()).thenReturn(List.of());

        assertThat(service.getAllCargos()).isEmpty();
    }

    // ── createCargo ──

    @Test
    void givenValidDTO_whenCreate_thenSavesAndReturnsMapped() {
        AdminCargoDTO inputDTO = buildDTO(null);
        Cargo domainCargo = buildCargo();
        Cargo savedCargo = buildCargo();
        AdminCargoDTO responseDTO = buildDTO(savedCargo.getId());

        when(mapper.toDomain(inputDTO)).thenReturn(domainCargo);
        when(cargoRepository.save(domainCargo)).thenReturn(savedCargo);
        when(mapper.toResponse(savedCargo)).thenReturn(responseDTO);

        AdminCargoDTO result = service.createCargo(inputDTO);

        assertThat(result.name()).isEqualTo("Test Cargo");
        verify(cargoRepository).save(domainCargo);
    }

    // ── updateCargo ──

    @Test
    void givenExistingCargo_whenUpdate_thenSavesAndReturnsUpdated() {
        UUID id = UUID.randomUUID();
        Cargo existing = buildCargo();
        AdminCargoDTO inputDTO = buildDTO(id);
        Cargo updatedDomain = buildCargo();
        AdminCargoDTO responseDTO = buildDTO(id);

        when(cargoRepository.findById(id)).thenReturn(Optional.of(existing));
        when(mapper.toDomainWithId(any())).thenReturn(updatedDomain);
        when(cargoRepository.save(updatedDomain)).thenReturn(updatedDomain);
        when(mapper.toResponse(updatedDomain)).thenReturn(responseDTO);

        AdminCargoDTO result = service.updateCargo(id, inputDTO);

        assertThat(result).isNotNull();
        verify(cargoRepository).save(updatedDomain);
    }

    @Test
    void givenUnknownId_whenUpdate_thenThrowsNotFound() {
        UUID unknownId = UUID.randomUUID();
        AdminCargoDTO dto = buildDTO(unknownId);

        when(cargoRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCargo(unknownId, dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cargo not found");
    }

    // ── deleteCargo ──

    @Test
    void givenExistingCargo_whenDelete_thenDeletesFromRepository() {
        UUID id = UUID.randomUUID();
        when(cargoRepository.findById(id)).thenReturn(Optional.of(buildCargo()));

        service.deleteCargo(id);

        verify(cargoRepository).deleteById(id);
    }

    @Test
    void givenUnknownId_whenDelete_thenThrowsNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(cargoRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCargo(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cargo not found");
    }
}