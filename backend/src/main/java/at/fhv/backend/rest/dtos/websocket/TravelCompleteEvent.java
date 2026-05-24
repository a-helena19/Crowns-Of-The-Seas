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
    private BigDecimal departureDockingFine;
    private BigDecimal dockingFine;

    public TravelCompleteEvent(String travelId, String playerId,
                               List<CargoRewardBreakdown> cargoRewards,
                               BigDecimal baseReward, BigDecimal totalReward, BigDecimal bonusReward,
                               BigDecimal previousBalance, BigDecimal newBalance,
                               BigDecimal departureDockingFine, BigDecimal dockingFine) {
        this.travelId = travelId;
        this.playerId = playerId;
        this.cargoRewards = cargoRewards;
        this.baseReward = baseReward;
        this.totalReward = totalReward;
        this.bonusReward = bonusReward;
        this.previousBalance = previousBalance;
        this.newBalance = newBalance;
        this.departureDockingFine = departureDockingFine != null ? departureDockingFine : BigDecimal.ZERO;
        this.dockingFine = dockingFine != null ? dockingFine : BigDecimal.ZERO;
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
}
