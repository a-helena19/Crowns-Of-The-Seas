package at.fhv.backend.domain.model.ship;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class ShipTest {
    @Test
    void givenValidParameters_whenCreate_thenIdIsAssigned() {
        Ship ship = Ship.create("Black Pearl", "A legendary ship", ShipClass.BUDGET,
                new BigDecimal("50000.00"), 200, 15.5, 0.8,
                new BigDecimal("1000.00"), new BigDecimal("500.00"), 0.9, "icons/black_pearl.png");

        assertThat(ship.getId()).isNotNull();
    }

    @Test
    void givenTwoCreatedShips_thenIdsAreUnique() {
        Ship ship1 = Ship.create("Black Pearl", "desc", ShipClass.BUDGET,
                new BigDecimal("50000.00"), 200, 15.5, 0.8,
                new BigDecimal("1000.00"), new BigDecimal("500.00"), 0.9, "icon.png");
        Ship ship2 = Ship.create("Black Pearl", "desc", ShipClass.BUDGET,
                new BigDecimal("50000.00"), 200, 15.5, 0.8,
                new BigDecimal("1000.00"), new BigDecimal("500.00"), 0.9, "icon.png");

        assertThat(ship1.getId()).isNotEqualTo(ship2.getId());
    }

    @Test
    void givenValidParameters_whenCreate_thenFieldsAreSetCorrectly() {
        Ship ship = Ship.create("Black Pearl", "A legendary ship", ShipClass.BUDGET,
                new BigDecimal("50000.00"), 200, 15.5, 0.8,
                new BigDecimal("1000.00"), new BigDecimal("500.00"), 0.9, "icons/black_pearl.png");

        assertThat(ship.getName()).isEqualTo("Black Pearl");
        assertThat(ship.getDescription()).isEqualTo("A legendary ship");
        assertThat(ship.getShipClass()).isEqualTo(ShipClass.BUDGET);
        assertThat(ship.getPrice()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(ship.getMaxCargoCapacity()).isEqualTo(200);
        assertThat(ship.getMaxSpeed()).isEqualTo(15.5);
        assertThat(ship.getFuelConsumption()).isEqualTo(0.8);
        assertThat(ship.getMaxFuel()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(ship.getOperatingCost()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(ship.getBaseReliability()).isEqualTo(0.9);
        assertThat(ship.getIconUrl()).isEqualTo("icons/black_pearl.png");
    }

    @Test
    void givenReconstructedShip_thenIdIsPreserved() {
        UUID fixedId = UUID.randomUUID();

        Ship ship = Ship.reconstruct(fixedId, "Flying Dutchman", "Ghost ship",
                ShipClass.PREMIUM, new BigDecimal("99999.00"), 500,
                12.0, 1.2, new BigDecimal("2000.00"), new BigDecimal("800.00"),
                0.75, "icons/dutchman.png");

        assertThat(ship.getId()).isEqualTo(fixedId);
    }

    @Test
    void givenReconstructedShip_thenFieldsMatch() {
        UUID fixedId = UUID.randomUUID();

        Ship ship = Ship.reconstruct(fixedId, "Flying Dutchman", "Ghost ship",
                ShipClass.PREMIUM, new BigDecimal("99999.00"), 500,
                12.0, 1.2, new BigDecimal("2000.00"), new BigDecimal("800.00"),
                0.75, "icons/dutchman.png");

        assertThat(ship.getName()).isEqualTo("Flying Dutchman");
        assertThat(ship.getDescription()).isEqualTo("Ghost ship");
        assertThat(ship.getShipClass()).isEqualTo(ShipClass.PREMIUM);
        assertThat(ship.getPrice()).isEqualByComparingTo(new BigDecimal("99999.00"));
        assertThat(ship.getMaxCargoCapacity()).isEqualTo(500);
        assertThat(ship.getMaxSpeed()).isEqualTo(12.0);
        assertThat(ship.getFuelConsumption()).isEqualTo(1.2);
        assertThat(ship.getMaxFuel()).isEqualByComparingTo(new BigDecimal("2000.00"));
        assertThat(ship.getOperatingCost()).isEqualByComparingTo(new BigDecimal("800.00"));
        assertThat(ship.getBaseReliability()).isEqualTo(0.75);
        assertThat(ship.getIconUrl()).isEqualTo("icons/dutchman.png");
    }
}