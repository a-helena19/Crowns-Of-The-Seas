package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;
import java.util.List;

public class TravelCompleteEvent {
    private String travelId;
    private String playerId;
    private List<CargoRewardBreakdown> cargoRewards;
    private BigDecimal baseReward;
    private BigDecimal totalReward;
    private BigDecimal previousBalance;
    private BigDecimal newBalance;

    // Constructor
    public TravelCompleteEvent(String travelId, String playerId,
                               List<CargoRewardBreakdown> cargoRewards,
                               BigDecimal baseReward, BigDecimal totalReward,
                               BigDecimal previousBalance, BigDecimal newBalance) {
        this.travelId = travelId;
        this.playerId = playerId;
        this.cargoRewards = cargoRewards;
        this.baseReward = baseReward;
        this.totalReward = totalReward;
        this.previousBalance = previousBalance;
        this.newBalance = newBalance;
    }

    // Getters
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
}