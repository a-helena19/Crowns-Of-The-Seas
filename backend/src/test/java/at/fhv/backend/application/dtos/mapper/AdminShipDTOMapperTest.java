package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipClass;
import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class AdminShipDTOMapperTest {

    private final AdminShipDTOMapper mapper = new AdminShipDTOMapper();

    private Ship buildShip() {
        return Ship.create("Test Ship", "A test vessel", ShipClass.STANDARD,
                BigDecimal.valueOf(25000), 150, 18.0, 1.5,
                BigDecimal.valueOf(800), BigDecimal.valueOf(300),
                0.85, "icons/test.png", 10);
    }

    @Test
    void givenShip_whenToResponse_thenAllFieldsMapped() {
        Ship ship = buildShip();

        AdminShipDTO dto = mapper.toResponse(ship);

        assertThat(dto.id()).isEqualTo(ship.getId());
        assertThat(dto.name()).isEqualTo("Test Ship");
        assertThat(dto.description()).isEqualTo("A test vessel");
        assertThat(dto.shipClass()).isEqualTo("STANDARD");
        assertThat(dto.price()).isEqualByComparingTo(BigDecimal.valueOf(25000));
        assertThat(dto.maxCargoCapacity()).isEqualTo(150);
        assertThat(dto.maxSpeed()).isEqualTo(18.0);
        assertThat(dto.fuelConsumption()).isEqualTo(1.5);
        assertThat(dto.maxFuel()).isEqualByComparingTo(BigDecimal.valueOf(800));
        assertThat(dto.operatingCost()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(dto.baseReliability()).isEqualTo(0.85);
        assertThat(dto.iconUrl()).isEqualTo("icons/test.png");
        assertThat(dto.stock()).isEqualTo(10);
    }

    @Test
    void givenDTO_whenToDomain_thenNewIdIsGenerated() {
        AdminShipDTO dto = new AdminShipDTO(
                null, "New Ship", "desc", "BUDGET",
                BigDecimal.valueOf(10000), 100, 12.0, 1.0,
                BigDecimal.valueOf(500), BigDecimal.valueOf(200),
                0.9, "icon.png", 20);

        Ship ship = mapper.toDomain(dto);

        assertThat(ship.getId()).isNotNull();
        assertThat(ship.getName()).isEqualTo("New Ship");
        assertThat(ship.getShipClass()).isEqualTo(ShipClass.BUDGET);
    }

    @Test
    void givenDTOWithId_whenToDomainWithId_thenIdIsPreserved() {
        UUID fixedId = UUID.randomUUID();
        AdminShipDTO dto = new AdminShipDTO(
                fixedId, "Updated Ship", "updated desc", "PREMIUM",
                BigDecimal.valueOf(50000), 300, 20.0, 2.0,
                BigDecimal.valueOf(1200), BigDecimal.valueOf(600),
                0.75, "icon2.png", 5);

        Ship ship = mapper.toDomainWithId(dto);

        assertThat(ship.getId()).isEqualTo(fixedId);
        assertThat(ship.getName()).isEqualTo("Updated Ship");
        assertThat(ship.getShipClass()).isEqualTo(ShipClass.PREMIUM);
        assertThat(ship.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(50000));
    }
}