package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;

public class HarborMasterDecorator extends SessionPlayerDecorator {

    public HarborMasterDecorator(ISessionPlayer wrappedPlayer) {
        super(wrappedPlayer);
    }

    @Override
    public double getLoadingTimeModifier() {
        return 0.70;
    }

    @Override
    public double getUnloadingTimeModifier() {
        return 0.70;
    }

    @Override
    public double getFuelCostModifier() {
        return 1.15;
    }
}