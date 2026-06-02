package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class SmugglerDecorator extends SessionPlayerDecorator {

    public SmugglerDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    // Vorteil: Mehr Schmuggel-Angebote (+20%) — der Schmuggler bekommt häufiger Angebote.
    @Override
    public double getSmuggleRiskModifier() {
        return 1.20;
    }

    // Vorteil: Geringeres Zoll-Risiko (−40%) — Schmuggler sind Profis im Ausweichen
    // und werden bei der Zollkontrolle seltener erwischt.
    @Override
    public double getCustomsRiskModifier() {
        return 0.80;
    }

    // Nachteil: Teurerer Treibstoff (+20%) — Sprit vom Schwarzmarkt kostet mehr.
    @Override
    public double getMiniGamesModifier() {
        return 1.20;
    }
}