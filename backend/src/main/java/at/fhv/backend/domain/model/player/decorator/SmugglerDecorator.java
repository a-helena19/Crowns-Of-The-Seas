package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class SmugglerDecorator extends SessionPlayerDecorator {

    public SmugglerDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    // Höhere Marktpreise/Belohnungen — passend zu "höhere Belohnungen"
    @Override
    public double getMarketOfferModifier() {
        return 1.30;
    }

    // Niedrigeres Eigen-Risiko beim Schmuggeln (Smuggler sind im Schmuggeln gut)
    @Override
    public double getSmuggleRiskModifier() {
        return 1.2;
    }

    // Höheres Zoll-Risiko — passt zur "höheres Risiko"-Beschreibung
    @Override
    public double getCustomsRiskModifier() {
        return 1.40;
    }

    // Hohes Risiko, hohe Beute: volatilere Reisen → +30% Minispiel-Häufigkeit
    @Override
    public double getMiniGameRiskModifier() {
        return 1.30;
    }
}