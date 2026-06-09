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
    private ObstacleMinigameTravelSummary obstacleMinigameSummary;
    private TreasureHuntMinigameTravelSummary treasureHuntMinigameSummary;
    private CustomsSummary customsSummary;
    private RegressSummary regressSummary;
    private BigDecimal departureDockingFine;
    private BigDecimal dockingFine;
    private BigDecimal pilotageRefund;
    private BigDecimal cargoReward;
    private BigDecimal smuggleReward;
    private BigDecimal grossReward;
    private BigDecimal minigameDeductions;
    private BigDecimal minigameBonus;
    private BigDecimal customsPaid;
    private BigDecimal dockingFines;
    private BigDecimal regress;
    private BigDecimal netPayout;

    public TravelCompleteEvent(String travelId, String playerId,
                               List<CargoRewardBreakdown> cargoRewards,
                               BigDecimal baseReward, BigDecimal totalReward, BigDecimal bonusReward,
                               BigDecimal previousBalance, BigDecimal newBalance,
                               BigDecimal departureDockingFine, BigDecimal dockingFine,
                               BigDecimal pilotageRefund,
                               BigDecimal cargoReward,
                               BigDecimal smuggleReward,
                               BigDecimal grossReward,
                               BigDecimal minigameDeductions,
                               BigDecimal minigameBonus,
                               BigDecimal customsPaid,
                               BigDecimal dockingFines,
                               BigDecimal regress,
                               BigDecimal netPayout,
                               RatMinigameTravelSummary ratMinigameSummary,
                               StormMinigameTravelSummary stormMinigameSummary,
                               ObstacleMinigameTravelSummary obstacleMinigameSummary,
                               TreasureHuntMinigameTravelSummary treasureHuntMinigameSummary,
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
        this.obstacleMinigameSummary = obstacleMinigameSummary;
        this.treasureHuntMinigameSummary = treasureHuntMinigameSummary;
        this.customsSummary = customsSummary;
        this.regressSummary = regressSummary;
        this.departureDockingFine = departureDockingFine != null ? departureDockingFine : BigDecimal.ZERO;
        this.dockingFine = dockingFine != null ? dockingFine : BigDecimal.ZERO;
        this.pilotageRefund = pilotageRefund != null ? pilotageRefund : BigDecimal.ZERO;
        this.cargoReward = cargoReward != null ? cargoReward : BigDecimal.ZERO;
        this.smuggleReward = smuggleReward != null ? smuggleReward : BigDecimal.ZERO;
        this.grossReward = grossReward != null ? grossReward : BigDecimal.ZERO;
        this.minigameDeductions = minigameDeductions != null ? minigameDeductions : BigDecimal.ZERO;
        this.minigameBonus = minigameBonus != null ? minigameBonus : BigDecimal.ZERO;
        this.customsPaid = customsPaid != null ? customsPaid : BigDecimal.ZERO;
        this.dockingFines = dockingFines != null ? dockingFines : BigDecimal.ZERO;
        this.regress = regress != null ? regress : BigDecimal.ZERO;
        this.netPayout = netPayout != null ? netPayout : BigDecimal.ZERO;
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

    public BigDecimal getCargoReward() {
        return cargoReward;
    }

    public BigDecimal getSmuggleReward() {
        return smuggleReward;
    }

    public BigDecimal getGrossReward() {
        return grossReward;
    }

    public BigDecimal getMinigameDeductions() {
        return minigameDeductions;
    }

    public BigDecimal getMinigameBonus() {
        return minigameBonus;
    }

    public BigDecimal getCustomsPaid() {
        return customsPaid;
    }

    public BigDecimal getDockingFines() {
        return dockingFines;
    }

    public BigDecimal getRegress() {
        return regress;
    }

    public BigDecimal getNetPayout() {
        return netPayout;
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

    public ObstacleMinigameTravelSummary getObstacleMinigameSummary() {
        return obstacleMinigameSummary;
    }

    public TreasureHuntMinigameTravelSummary getTreasureHuntMinigameSummary() {
        return treasureHuntMinigameSummary;
    }
}
