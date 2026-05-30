package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class CargoRewardBreakdown {
    private String cargoId;
    private String cargoName;
    private String destinationPort;
    private BigDecimal baseReward;
    private BigDecimal actualReward;
    private BigDecimal bonusReward;
    private int percentage;
    private String status;
    private String cargoType;
    private String playerShipId;

    public CargoRewardBreakdown(String cargoId, String cargoName,
                                String destinationPort, BigDecimal baseReward,
                                BigDecimal actualReward, BigDecimal bonusReward, int percentage,
                                String status, String cargoType, String playerShipId) {
        this.cargoId = cargoId;
        this.cargoName = cargoName;
        this.destinationPort = destinationPort;
        this.baseReward = baseReward;
        this.actualReward = actualReward;
        this.bonusReward = bonusReward;
        this.percentage = percentage;
        this.status = status;
        this.cargoType = cargoType;
        this.playerShipId = playerShipId;
    }

    public String getPlayerShipId() {
        return playerShipId;
    }

    public String getCargoId() {
        return cargoId;
    }

    public String getCargoName() {
        return cargoName;
    }

    public String getDestinationPort() {
        return destinationPort;
    }

    public BigDecimal getBaseReward() {
        return baseReward;
    }

    public BigDecimal getActualReward() {
        return actualReward;
    }

    public BigDecimal getBonusReward() {
        return bonusReward;
    }

    public int getPercentage() {
        return percentage;
    }

    public String getStatus() {
        return status;
    }

    public String getCargoType() {
        return cargoType;
    }
}