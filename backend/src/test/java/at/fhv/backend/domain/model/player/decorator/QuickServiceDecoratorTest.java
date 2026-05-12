package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class QuickServiceDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer quickServicePlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        quickServicePlayer = new QuickServiceDecorator(basePlayer);
    }

    @Test
    void testFuelTimeModifier() {
        assertEquals(0.70, quickServicePlayer.getFuelTimeModifier(), 0.01);
    }

    @Test
    void testRepairTimeModifier() {
        assertEquals(0.70, quickServicePlayer.getRepairTimeModifier(), 0.01);
    }

    @Test
    void testEarlyOrderDetectionModifier() {
        assertEquals(1.30, quickServicePlayer.getEarlyOrderDetectionModifier(), 0.01);
    }

    @Test
    void testFuelCostUnmodified() {
        assertEquals(1.0, quickServicePlayer.getFuelCostModifier(), 0.01);
    }
}