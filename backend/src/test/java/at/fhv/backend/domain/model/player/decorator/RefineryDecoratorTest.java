package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RefineryDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer refineryPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        refineryPlayer = new RefineryDecorator(basePlayer);
    }

    @Test
    void testFuelCostModifier() {
        assertEquals(0.75, refineryPlayer.getFuelCostModifier(), 0.01);
    }

    @Test
    void testRepairTimeModifier() {
        assertEquals(1.15, refineryPlayer.getRepairTimeModifier(), 0.01);
    }

    @Test
    void testRepairCostUnmodified() {
        assertEquals(1.0, refineryPlayer.getRepairCostModifier(), 0.01);
    }

    @Test
    void testLoadingTimeUnmodified() {
        assertEquals(1.0, refineryPlayer.getLoadingTimeModifier(), 0.01);
    }
}