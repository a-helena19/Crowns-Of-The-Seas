package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DecoratorChainTest {

    private ISessionPlayer basePlayer;

    @BeforeEach
    void setUp() {
        basePlayer = new BaseSessionPlayer(
                UUID.randomUUID(), UUID.randomUUID(), "TestPlayer", false
        );
    }

    @Test
    void testDecoratorPreservesPlayerIdentity() {
        ISessionPlayer engineer = new EngineerDecorator(basePlayer);

        // Das Decorator ändert nicht die Spieler-Identität
        assertEquals(basePlayer.getId(), engineer.getId());
        assertEquals(basePlayer.getUserId(), engineer.getUserId());
        assertEquals(basePlayer.getPlayerName(), engineer.getPlayerName());
    }

    @Test
    void testMultipleDecoratorsWouldNotWork() {
        // Dies ist ein Anti-Pattern, aber testbar
        ISessionPlayer engineer = new EngineerDecorator(basePlayer);
        ISessionPlayer doubleDecorated = new RefineryDecorator(engineer);

        // Das sollte NOT kombiniert werden, daher nicht empfohlen
        // Aber technically würde es funktionieren
        assertEquals(0.75, doubleDecorated.getRepairCostModifier()); // Engineer
        assertEquals(0.75, doubleDecorated.getFuelCostModifier()); // Refinery
    }

    @Test
    void testDecoratorDoesNotAffectBalance() {
        var originalBalance = basePlayer.getBalance();
        ISessionPlayer engineer = new EngineerDecorator(basePlayer);

        assertEquals(originalBalance, engineer.getBalance());
    }
}