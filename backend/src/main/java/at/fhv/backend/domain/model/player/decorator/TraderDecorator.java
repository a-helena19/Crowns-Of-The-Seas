package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class TraderDecorator extends SessionPlayerDecorator {

    public TraderDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getMarketOfferModifier() {
        return 1.20;
    }

    @Override
    public double getMarketOfferQuantityModifier() {
        return 1.20;
    }

    // Nachteil: Weniger Schmuggel-Angebote (−20%) — Händler agieren legal und
    // werden von Schmugglern seltener angesprochen.
    @Override
    public double getSmuggleRiskModifier() {
        return 0.80;
    }
}