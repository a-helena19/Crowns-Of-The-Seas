package at.fhv.backend.domain.model.player.decorator;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;

import java.math.BigDecimal;
import java.util.UUID;

public abstract class SessionPlayerDecorator implements ISessionPlayer {

    protected final ISessionPlayer wrappedPlayer;

    public SessionPlayerDecorator(ISessionPlayer wrappedPlayer) {
        this.wrappedPlayer = wrappedPlayer;
    }

    @Override
    public UUID getId() {
        return wrappedPlayer.getId();
    }

    @Override
    public UUID getUserId() {
        return wrappedPlayer.getUserId();
    }

    @Override
    public UUID getSessionId() {
        return wrappedPlayer.getSessionId();
    }

    @Override
    public String getPlayerName() {
        return wrappedPlayer.getPlayerName();
    }

    @Override
    public boolean isHost() {
        return wrappedPlayer.isHost();
    }

    @Override
    public BigDecimal getBalance() {
        return wrappedPlayer.getBalance();
    }

    @Override
    public PlayerFaction getFaction() {
        return wrappedPlayer.getFaction();
    }

    @Override
    public void setHost(boolean host) {
        wrappedPlayer.setHost(host);
    }

    @Override
    public boolean hasSufficientBalance(BigDecimal amount) {
        return wrappedPlayer.hasSufficientBalance(amount);
    }

    @Override
    public void addBalance(BigDecimal amount) {
        wrappedPlayer.addBalance(amount);
    }

    @Override
    public void subtractBalance(BigDecimal amount) {
        wrappedPlayer.subtractBalance(amount);
    }

    @Override
    public double getRepairCostModifier() {
        return wrappedPlayer.getRepairCostModifier();
    }

    @Override
    public double getFuelCostModifier() {
        return wrappedPlayer.getFuelCostModifier();
    }

    @Override
    public double getSmuggleRiskModifier() {
        return wrappedPlayer.getSmuggleRiskModifier();
    }

    @Override
    public double getCustomsRiskModifier() {
        return wrappedPlayer.getCustomsRiskModifier();
    }

    @Override
    public double getRepairTimeModifier() {
        return wrappedPlayer.getRepairTimeModifier();
    }

    @Override
    public double getFuelTimeModifier() {
        return wrappedPlayer.getFuelTimeModifier();
    }

    @Override
    public double getLoadingTimeModifier() {
        return wrappedPlayer.getLoadingTimeModifier();
    }

    @Override
    public double getUnloadingTimeModifier() {
        return wrappedPlayer.getUnloadingTimeModifier();
    }

    @Override
    public double getMiniGameRiskModifier() {
        return wrappedPlayer.getMiniGameRiskModifier();
    }

    @Override
    public double getEarlyOrderDetectionModifier() {
        return wrappedPlayer.getEarlyOrderDetectionModifier();
    }

    @Override
    public double getMarketOfferModifier() {
        return wrappedPlayer.getMarketOfferModifier();
    }

    @Override
    public double getMarketOfferQuantityModifier() {
        return wrappedPlayer.getMarketOfferQuantityModifier();
    }
}