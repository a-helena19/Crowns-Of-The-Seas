package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TraderDecoratorTest {

    private ISessionPlayer basePlayer;
    private ISessionPlayer traderPlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
        traderPlayer = new TraderDecorator(basePlayer);
    }

    @Test
    void testMarketOfferModifier() {
        assertEquals(1.20, traderPlayer.getMarketOfferModifier(), 0.01);
    }

    @Test
    void testMarketOfferQuantityModifier() {
        assertEquals(1.20, traderPlayer.getMarketOfferQuantityModifier(), 0.01);
    }

    @Test
    void testSmuggleRiskModifier() {
        assertEquals(1.20, traderPlayer.getSmuggleRiskModifier(), 0.01);
    }

    @Test
    void testRepairCostUnmodified() {
        assertEquals(1.0, traderPlayer.getRepairCostModifier(), 0.01);
    }
}