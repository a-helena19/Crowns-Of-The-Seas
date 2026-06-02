package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class ScoutDecorator extends SessionPlayerDecorator {

    public ScoutDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getEarlyOrderDetectionModifier() {
        return 0.50;
    }

    // Scouts erkennen Gefahren früh und fahren ruhigere Routen: −30% Minispiel-Häufigkeit
    @Override
    public double getMiniGameRiskModifier() {
        return 0.70;
    }

    @Override
    public double getFuelTimeModifier() {
        return 1.20;
    }

    @Override
    public double getRepairTimeModifier() {
        return 1.20;
    }
}