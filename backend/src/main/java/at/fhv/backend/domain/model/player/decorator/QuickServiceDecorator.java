package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class QuickServiceDecorator extends SessionPlayerDecorator {

    public QuickServiceDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getFuelTimeModifier() {
        return 0.70;
    }

    @Override
    public double getRepairTimeModifier() {
        return 0.70;
    }

    @Override
    public double getEarlyOrderDetectionModifier() {
        return 1.30;
    }
}