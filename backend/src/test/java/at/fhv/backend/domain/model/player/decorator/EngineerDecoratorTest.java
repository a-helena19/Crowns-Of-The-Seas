package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EngineerDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer engineerPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        engineerPlayer = new EngineerDecorator(basePlayer);
    }

    @Test
    void testRepairCostModifier() {
        assertEquals(0.75, engineerPlayer.getRepairCostModifier(), 0.01);
    }

    @Test
    void testLoadingTimeModifier() {
        assertEquals(1.20, engineerPlayer.getLoadingTimeModifier(), 0.01);
    }

    @Test
    void testUnloadingTimeModifier() {
        assertEquals(1.20, engineerPlayer.getUnloadingTimeModifier(), 0.01);
    }

    @Test
    void testFuelCostUnmodified() {
        assertEquals(1.0, engineerPlayer.getFuelCostModifier(), 0.01);
    }

    @Test
    void testDelegationOfBalance() {
        assertEquals(basePlayer.getBalance(), engineerPlayer.getBalance());
    }

    @Test
    void testPlayerNameDelegation() {
        assertEquals(basePlayer.getPlayerName(), engineerPlayer.getPlayerName());
    }

    @Test
    void testIdDelegation() {
        assertEquals(basePlayer.getId(), engineerPlayer.getId());
    }
}