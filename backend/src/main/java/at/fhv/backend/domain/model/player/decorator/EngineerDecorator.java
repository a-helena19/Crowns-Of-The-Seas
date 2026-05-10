package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class EngineerDecorator extends SessionPlayerDecorator {

    public EngineerDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getRepairCostModifier() {
        return 0.75;
    }

    @Override
    public double getLoadingTimeModifier() {
        return 1.20;
    }

    @Override
    public double getUnloadingTimeModifier() {
        return 1.20;
    }
}