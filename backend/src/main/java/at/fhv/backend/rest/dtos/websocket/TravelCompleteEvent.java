package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;
import java.util.List;

public class TravelCompleteEvent {
    private String travelId;
    private String playerId;
    private List<CargoRewardBreakdown> cargoRewards;
    private BigDecimal baseReward;
    private BigDecimal totalReward;
    private BigDecimal bonusReward;
    private BigDecimal previousBalance;
    private BigDecimal newBalance;
    private RatMinigameTravelSummary ratMinigameSummary;
    private StormMinigameTravelSummary stormMinigameSummary;
    private CustomsSummary customsSummary;
    private RegressSummary regressSummary;
    private BigDecimal departureDockingFine;
    private BigDecimal dockingFine;
    private BigDecimal pilotageRefund;

    public TravelCompleteEvent(String travelId, String playerId,
                               List<CargoRewardBreakdown> cargoRewards,
                               BigDecimal baseReward, BigDecimal totalReward, BigDecimal bonusReward,
                               BigDecimal previousBalance, BigDecimal newBalance,
                               BigDecimal departureDockingFine, BigDecimal dockingFine,
                               BigDecimal pilotageRefund,
                               RatMinigameTravelSummary ratMinigameSummary,
                               StormMinigameTravelSummary stormMinigameSummary,
                               CustomsSummary customsSummary,
                               RegressSummary regressSummary) {
        this.travelId = travelId;
        this.playerId = playerId;
        this.cargoRewards = cargoRewards;
        this.baseReward = baseReward;
        this.totalReward = totalReward;
        this.bonusReward = bonusReward;
        this.previousBalance = previousBalance;
        this.newBalance = newBalance;
        this.ratMinigameSummary = ratMinigameSummary;
        this.customsSummary = customsSummary;
        this.regressSummary = regressSummary;
        this.departureDockingFine = departureDockingFine != null ? departureDockingFine : BigDecimal.ZERO;
        this.dockingFine = dockingFine != null ? dockingFine : BigDecimal.ZERO;
        this.pilotageRefund = pilotageRefund != null ? pilotageRefund : BigDecimal.ZERO;
        this.stormMinigameSummary = stormMinigameSummary;
    }

    public String getTravelId() {
        return travelId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public List<CargoRewardBreakdown> getCargoRewards() {
        return cargoRewards;
    }

    public BigDecimal getBaseReward() {
        return baseReward;
    }

    public BigDecimal getTotalReward() {
        return totalReward;
    }

    public BigDecimal getPreviousBalance() {
        return previousBalance;
    }

    public BigDecimal getNewBalance() {
        return newBalance;
    }

    public BigDecimal getBonusReward() {
        return bonusReward;
    }

    public BigDecimal getDepartureDockingFine() {
        return departureDockingFine;
    }

    public BigDecimal getDockingFine() {
        return dockingFine;
    }

    public BigDecimal getPilotageRefund() {
        return pilotageRefund;
    }

    public RatMinigameTravelSummary getRatMinigameSummary() {
        return ratMinigameSummary;
    }

    public CustomsSummary getCustomsSummary() {
        return customsSummary;
    }

    public RegressSummary getRegressSummary() {
        return regressSummary;
    }

    public StormMinigameTravelSummary getStormMinigameSummary() {
        return stormMinigameSummary;
    }
}
