package at.fhv.backend.rest.dtos.websocket;

import java.math.BigDecimal;

public class CargoRewardBreakdown {
    private String cargoId;
    private String cargoName;
    private String destinationPort;
    private BigDecimal baseReward;
    private BigDecimal actualReward;
    private int percentage;
    private String status;  // "DELIVERED" oder "EXPIRED"
    private String cargoType;

    // Constructor
    public CargoRewardBreakdown(String cargoId, String cargoName,
                                String destinationPort, BigDecimal baseReward,
                                BigDecimal actualReward, int percentage,
                                String status, String cargoType) {
        this.cargoId = cargoId;
        this.cargoName = cargoName;
        this.destinationPort = destinationPort;
        this.baseReward = baseReward;
        this.actualReward = actualReward;
        this.percentage = percentage;
        this.status = status;
        this.cargoType = cargoType;
    }

    // Getters
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