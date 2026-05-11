package at.fhv.backend.domain.model.player;

import at.fhv.backend.domain.model.player.exception.InsufficientBalanceException;
import at.fhv.backend.domain.model.player.exception.InvalidAmountException;

import java.math.BigDecimal;
import java.util.UUID;

public class BaseSessionPlayer implements ISessionPlayer {

    private final UUID id;
    private final UUID userId;
    private final UUID sessionId;
    private final String playerName;
    private boolean isHost;
    private BigDecimal balance;
    private PlayerFaction faction;

    public BaseSessionPlayer(UUID userId, UUID sessionId,
                             String playerName, boolean isHost) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.sessionId = sessionId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.balance = BigDecimal.valueOf(40000.00); // Startkapital
        this.faction = null;
    }

    private BaseSessionPlayer(UUID id, UUID userId, UUID sessionId,
                              String playerName, boolean isHost, BigDecimal balance, PlayerFaction faction) {
        this.id = id;
        this.userId = userId;
        this.sessionId = sessionId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.balance = balance;
        this.faction = faction;
    }

    public static BaseSessionPlayer reconstruct(UUID id, UUID userId, UUID sessionId,
                                                String playerName, boolean isHost, BigDecimal balance, PlayerFaction faction) {
        return new BaseSessionPlayer(id, userId, sessionId, playerName, isHost, balance, faction);
    }

    @Override
    public UUID getId(){
        return id;
    }

    @Override
    public UUID getUserId(){
        return userId;
    }

    @Override
    public UUID getSessionId(){
        return sessionId;
    }

    @Override
    public String getPlayerName(){
        return playerName;
    }

    @Override
    public boolean isHost(){
        return isHost;
    }

    @Override
    public BigDecimal getBalance() {
        return balance;
    }

    @Override
    public PlayerFaction getFaction() {
        return faction;
    }

    @Override
    public void setHost(boolean host) {
        this.isHost = host;
    }

    @Override
    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    @Override
    public void addBalance(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new InvalidAmountException(amount);
        this.balance = this.balance.add(amount);
    }

    @Override
    public void subtractBalance(BigDecimal amount) {
        if (!hasSufficientBalance(amount))
            throw new InsufficientBalanceException(userId, amount);
        this.balance = this.balance.subtract(amount);
    }

    // Kosten — alle neutral
    @Override
    public double getRepairCostModifier()  { return 1.0; }

    @Override
    public double getFuelCostModifier()    { return 1.0; }

    @Override
    public double getSmuggleRiskModifier() { return 1.0; }

    @Override
    public double getCustomsRiskModifier() { return 1.0; }

    // Zeit — alle neutral
    @Override
    public double getRepairTimeModifier() { return 1.0; }

    @Override
    public double getFuelTimeModifier() { return 1.0; }

    @Override
    public double getLoadingTimeModifier() { return 1.0; }

    @Override
    public double getUnloadingTimeModifier() { return 1.0; }

    // Gameplay — alle neutral
    @Override
    public double getMiniGameRiskModifier() { return 1.0; }

    @Override
    public double getEarlyOrderDetectionModifier() { return 1.0; }

    @Override
    public double getMarketOfferModifier() { return 1.0; }

    @Override
    public double getMarketOfferQuantityModifier() { return 1.0; }
}