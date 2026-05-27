package at.fhv.backend.application.services.admin;

import at.fhv.backend.application.dtos.mapper.AdminShipDTOMapper;
import at.fhv.backend.application.services.impl.admin.AdminShipServiceImpl;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
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
class AdminShipServiceImplTest {

    @Mock private ShipRepository shipRepository;
    @Mock private AdminShipDTOMapper mapper;

    private AdminShipServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminShipServiceImpl(shipRepository, mapper);
    }

    private Ship buildShip() {
        return Ship.create("Test Ship", "desc", ShipClass.BUDGET,
                BigDecimal.valueOf(10000), 100, 12.0, 1.0,
                BigDecimal.valueOf(500), BigDecimal.valueOf(200),
                0.9, "icon.png", 20);
    }

    private AdminShipDTO buildDTO(UUID id) {
        return new AdminShipDTO(id, "Test Ship", "desc", "BUDGET",
                BigDecimal.valueOf(10000), 100, 12.0, 1.0,
                BigDecimal.valueOf(500), BigDecimal.valueOf(200),
                0.9, "icon.png", 20);
    }

    // ── getAllShips ──

    @Test
    void givenShipsExist_whenGetAll_thenReturnsMappedList() {
        Ship ship1 = buildShip();
        Ship ship2 = buildShip();
        AdminShipDTO dto1 = buildDTO(ship1.getId());
        AdminShipDTO dto2 = buildDTO(ship2.getId());

        when(shipRepository.findAll()).thenReturn(List.of(ship1, ship2));
        when(mapper.toResponse(ship1)).thenReturn(dto1);
        when(mapper.toResponse(ship2)).thenReturn(dto2);

        List<AdminShipDTO> result = service.getAllShips();

        assertThat(result).hasSize(2);
        verify(shipRepository).findAll();
    }

    @Test
    void givenNoShips_whenGetAll_thenReturnsEmptyList() {
        when(shipRepository.findAll()).thenReturn(List.of());

        List<AdminShipDTO> result = service.getAllShips();

        assertThat(result).isEmpty();
    }

    // ── createShip ──

    @Test
    void givenValidDTO_whenCreate_thenSavesAndReturnsMappedDTO() {
        AdminShipDTO inputDTO = buildDTO(null);
        Ship domainShip = buildShip();
        Ship savedShip = buildShip();
        AdminShipDTO responseDTO = buildDTO(savedShip.getId());

        when(mapper.toDomain(inputDTO)).thenReturn(domainShip);
        when(shipRepository.save(domainShip)).thenReturn(savedShip);
        when(mapper.toResponse(savedShip)).thenReturn(responseDTO);

        AdminShipDTO result = service.createShip(inputDTO);

        assertThat(result.name()).isEqualTo("Test Ship");
        verify(shipRepository).save(domainShip);
    }

    // ── updateShip ──

    @Test
    void givenExistingShip_whenUpdate_thenSavesAndReturnsUpdated() {
        UUID id = UUID.randomUUID();
        Ship existing = buildShip();
        AdminShipDTO inputDTO = buildDTO(id);
        Ship updatedDomain = buildShip();
        AdminShipDTO responseDTO = buildDTO(id);

        when(shipRepository.findById(id)).thenReturn(Optional.of(existing));
        when(mapper.toDomainWithId(any())).thenReturn(updatedDomain);
        when(shipRepository.save(updatedDomain)).thenReturn(updatedDomain);
        when(mapper.toResponse(updatedDomain)).thenReturn(responseDTO);

        AdminShipDTO result = service.updateShip(id, inputDTO);

        assertThat(result).isNotNull();
        verify(shipRepository).save(updatedDomain);
    }

    @Test
    void givenUnknownId_whenUpdate_thenThrowsNotFound() {
        UUID unknownId = UUID.randomUUID();
        AdminShipDTO dto = buildDTO(unknownId);

        when(shipRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateShip(unknownId, dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Ship not found");
    }

    // ── deleteShip ──

    @Test
    void givenExistingShip_whenDelete_thenDeletesFromRepository() {
        UUID id = UUID.randomUUID();
        Ship existing = buildShip();

        when(shipRepository.findById(id)).thenReturn(Optional.of(existing));

        service.deleteShip(id);

        verify(shipRepository).deleteById(id);
    }

    @Test
    void givenUnknownId_whenDelete_thenThrowsNotFound() {
        UUID unknownId = UUID.randomUUID();

        when(shipRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteShip(unknownId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Ship not found");
    }
}