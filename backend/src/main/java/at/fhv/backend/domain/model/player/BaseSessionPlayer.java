package at.fhv.backend.domain.model.player;

import java.math.BigDecimal;
import java.util.UUID;

public class BaseSessionPlayer implements ISessionPlayer {

    private final UUID id;
    private final UUID userId;
    private final UUID sessionId;
    private final String playerName;
    private final boolean isHost;
    private BigDecimal balance;

    public BaseSessionPlayer(UUID userId, UUID sessionId,
                             String playerName, boolean isHost) {
        this.id = null;
        this.userId = userId;
        this.sessionId = sessionId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.balance = BigDecimal.valueOf(40000.00); // Startkapital
    }

    private BaseSessionPlayer(UUID id, UUID userId, UUID sessionId,
                             String playerName, boolean isHost, BigDecimal balance) {
        this.id = id;
        this.userId = userId;
        this.sessionId = sessionId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.balance = balance;
    }

    public static BaseSessionPlayer reconstruct(UUID id, UUID userId, UUID sessionId,
                                                String playerName, boolean isHost, BigDecimal balance) {
        return new BaseSessionPlayer(id, userId, sessionId, playerName, isHost, balance);
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
    public double getRepairTimeModifier()   { return 1.0; }

    @Override
    public double getFuelTimeModifier()     { return 1.0; }

    @Override
    public double getLoadingTimeModifier()  { return 1.0; }

    @Override
    public double getUnloadingTimeModifier(){ return 1.0; }

    // Gameplay — alle neutral
    @Override
    public double getMiniGameRiskModifier()        { return 1.0; }

    @Override
    public double getEarlyOrderDetectionModifier() { return 1.0; }

    @Override
    public double getMarketOfferModifier()         { return 1.0; }

    @Override
    public double getMarketOfferQuantityModifier() { return 1.0; }



}
