package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SmugglerDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer smugglerPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        smugglerPlayer = new SmugglerDecorator(basePlayer);
    }

    @Test
    void testMarketOfferModifier() {
        assertEquals(1.30, smugglerPlayer.getMarketOfferModifier(), 0.01);
    }

    @Test
    void testSmuggleRiskModifier() {
        assertEquals(1.20, smugglerPlayer.getSmuggleRiskModifier(), 0.01);
    }

    @Test
    void testCustomsRiskModifier() {
        assertEquals(1.40, smugglerPlayer.getCustomsRiskModifier(), 0.01);
    }

    @Test
    void testRepairCostUnmodified() {
        assertEquals(1.0, smugglerPlayer.getRepairCostModifier(), 0.01);
    }

    @Test
    void testFuelCostUnmodified() {
        assertEquals(1.0, smugglerPlayer.getFuelCostModifier(), 0.01);
    }

    @Test
    void testLoadingTimeUnmodified() {
        assertEquals(1.0, smugglerPlayer.getLoadingTimeModifier(), 0.01);
    }

    @Test
    void testUnloadingTimeUnmodified() {
        assertEquals(1.0, smugglerPlayer.getUnloadingTimeModifier(), 0.01);
    }

    @Test
    void testMinigameRiskModifier() {
        assertEquals(1.30, smugglerPlayer.getMiniGameRiskModifier(), 0.01);
    }

    @Test
    void testDelegationOfBalance() {
        assertEquals(basePlayer.getBalance(), smugglerPlayer.getBalance());
    }

    @Test
    void testPlayerNameDelegation() {
        assertEquals(basePlayer.getPlayerName(), smugglerPlayer.getPlayerName());
    }

    @Test
    void testIdDelegation() {
        assertEquals(basePlayer.getId(), smugglerPlayer.getId());
    }
}