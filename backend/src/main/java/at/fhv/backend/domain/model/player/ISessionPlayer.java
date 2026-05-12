package at.fhv.backend.domain.model.player;

import java.math.BigDecimal;
import java.util.UUID;

public interface ISessionPlayer {
    UUID getId();
    UUID getUserId();
    UUID getSessionId();
    String getPlayerName();
    boolean isHost();
    BigDecimal getBalance();
    void setHost(boolean host);

    PlayerFaction getFaction();

    UUID getHomePortId();
    void setHomePortId(UUID homePortId);

    boolean hasSufficientBalance(BigDecimal amount);
    void addBalance(BigDecimal amount);
    void subtractBalance(BigDecimal amount);

    // Kosten-Modifier (1.0 = normal, 0.75 = -25%, 1.25 = +25%)
    double getRepairCostModifier();
    double getFuelCostModifier();
    double getSmuggleRiskModifier();
    double getCustomsRiskModifier();

    // Zeit-Modifier (1.0 = normal, 0.7 = -30%, 1.2 = +20%)
    double getRepairTimeModifier();
    double getFuelTimeModifier();
    double getLoadingTimeModifier();
    double getUnloadingTimeModifier();

    // Gameplay-Modifier
    double getMiniGameRiskModifier();
    double getEarlyOrderDetectionModifier();
    double getMarketOfferModifier();
    double getMarketOfferQuantityModifier();
}
