package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ScoutDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer scoutPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        scoutPlayer = new ScoutDecorator(basePlayer);
    }

    @Test
    void testEarlyOrderDetectionModifier() {
        assertEquals(0.50, scoutPlayer.getEarlyOrderDetectionModifier(), 0.01);
    }

    @Test
    void testFuelTimeModifier() {
        assertEquals(1.20, scoutPlayer.getFuelTimeModifier(), 0.01);
    }

    @Test
    void testRepairTimeModifier() {
        assertEquals(1.20, scoutPlayer.getRepairTimeModifier(), 0.01);
    }

    @Test
    void testFuelCostUnmodified() {
        assertEquals(1.0, scoutPlayer.getFuelCostModifier(), 0.01);
    }

    @Test
    void testMinigameRiskModifier() {
        assertEquals(0.70, scoutPlayer.getMiniGameRiskModifier(), 0.01);
    }
}