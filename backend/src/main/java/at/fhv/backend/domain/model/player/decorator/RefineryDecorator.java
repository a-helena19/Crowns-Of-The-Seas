package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class RefineryDecorator extends SessionPlayerDecorator {

    public RefineryDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getFuelCostModifier() {
        return 0.75;
    }

    @Override
    public double getRepairTimeModifier() {
        return 1.15;
    }
}