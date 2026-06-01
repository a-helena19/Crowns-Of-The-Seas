package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.player.exception.InvalidFactionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FactionDecoratorFactoryTest {

    private ISessionPlayer basePlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
    }

    @Test
    void testCreateEngineerDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.ENGINEERS);

        assertNotNull(decorated);
        assertTrue(decorated instanceof EngineerDecorator);
        assertEquals(0.75, decorated.getRepairCostModifier(), 0.01);
    }

    @Test
    void testCreateRefineryDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.REFINERIES);

        assertNotNull(decorated);
        assertTrue(decorated instanceof RefineryDecorator);
        assertEquals(0.75, decorated.getFuelCostModifier(), 0.01);
    }

    @Test
    void testCreateHarborMasterDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.HARBOR_MASTERS);

        assertNotNull(decorated);
        assertTrue(decorated instanceof HarborMasterDecorator);
        assertEquals(0.70, decorated.getLoadingTimeModifier(), 0.01);
    }

    @Test
    void testCreateScoutDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.SCOUTS);

        assertNotNull(decorated);
        assertTrue(decorated instanceof ScoutDecorator);
        assertEquals(0.50, decorated.getEarlyOrderDetectionModifier(), 0.01);
    }

    @Test
    void testCreateTraderDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.TRADERS);

        assertNotNull(decorated);
        assertTrue(decorated instanceof TraderDecorator);
        assertEquals(1.20, decorated.getMarketOfferModifier(), 0.01);
    }

    @Test
    void testCreateQuickServiceDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.QUICK_SERVICE);

        assertNotNull(decorated);
        assertTrue(decorated instanceof QuickServiceDecorator);
        assertEquals(0.70, decorated.getFuelTimeModifier(), 0.01);
    }

    @Test
    void testNullFactionReturnsBasePlayer() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, null);

        assertNotNull(decorated);
        assertEquals(basePlayer, decorated);
    }

    @Test
    void testCreateSmugglerDecorator() {
        ISessionPlayer decorated = FactionDecoratorFactory.createDecoratedPlayer(basePlayer, PlayerFaction.SMUGGLERS);

        assertNotNull(decorated);
        assertTrue(decorated instanceof SmugglerDecorator);
        assertEquals(1.20, decorated.getSmuggleRiskModifier(), 0.01);
    }
}