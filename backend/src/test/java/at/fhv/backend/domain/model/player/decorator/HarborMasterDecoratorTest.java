package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class HarborMasterDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer harborMasterPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        harborMasterPlayer = new HarborMasterDecorator(basePlayer);
    }

    @Test
    void testLoadingTimeModifier() {
        assertEquals(0.70, harborMasterPlayer.getLoadingTimeModifier(), 0.01);
    }

    @Test
    void testUnloadingTimeModifier() {
        assertEquals(0.70, harborMasterPlayer.getUnloadingTimeModifier(), 0.01);
    }

    @Test
    void testFuelCostModifier() {
        assertEquals(1.15, harborMasterPlayer.getFuelCostModifier(), 0.01);
    }

    @Test
    void testRepairCostUnmodified() {
        assertEquals(1.0, harborMasterPlayer.getRepairCostModifier(), 0.01);
    }
}