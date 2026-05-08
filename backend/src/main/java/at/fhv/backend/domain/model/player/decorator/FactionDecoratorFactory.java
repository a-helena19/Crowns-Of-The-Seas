package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.player.exception.InvalidFactionException;

public class FactionDecoratorFactory {

    private FactionDecoratorFactory() {
        // utility class
    }

    public static ISessionPlayer createDecoratedPlayer(ISessionPlayer player, PlayerFaction faction) {
        if (faction == null) {
            return player;
        }

        return switch (faction) {
            case ENGINEERS      -> new EngineerDecorator(player);
            case REFINERIES     -> new RefineryDecorator(player);
            case HARBOR_MASTERS -> new HarborMasterDecorator(player);
            case SCOUTS         -> new ScoutDecorator(player);
            case TRADERS        -> new TraderDecorator(player);
            case QUICK_SERVICE  -> new QuickServiceDecorator(player);
            default -> throw new InvalidFactionException(faction.name());
        };
    }
}