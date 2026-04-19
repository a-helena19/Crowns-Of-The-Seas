package at.fhv.backend.rest.dtos.ship.response;

import java.util.List;

public class FuelEstimateDTO {
    private double currentFuelPercent;
    private double maxFuel;
    private double distance;
    private List<SpeedOption> speedOptions;

    public FuelEstimateDTO() {}

    public FuelEstimateDTO(double currentFuelPercent, double maxFuel, double distance, List<SpeedOption> speedOptions) {
        this.currentFuelPercent = currentFuelPercent;
        this.maxFuel = maxFuel;
        this.distance = distance;
        this.speedOptions = speedOptions;
    }

    public double getCurrentFuelPercent() {
        return currentFuelPercent;
    }

    public void setCurrentFuelPercent(double currentFuelPercent) {
        this.currentFuelPercent = currentFuelPercent;
    }

    public double getMaxFuel() {
        return maxFuel;
    }

    public void setMaxFuel(double maxFuel) {
        this.maxFuel = maxFuel;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public List<SpeedOption> getSpeedOptions() {
        return speedOptions;
    }

    public void setSpeedOptions(List<SpeedOption> speedOptions) {
        this.speedOptions = speedOptions;
    }

    public static class SpeedOption {
        private double speedSetting;
        private String label;
        private double fuelRequiredPercent;
        private boolean canAfford;

        public SpeedOption() {}
        public SpeedOption(double speedSetting, String label, double fuelRequiredPercent, boolean canAfford) {
            this.speedSetting = speedSetting;
            this.label = label;
            this.fuelRequiredPercent = fuelRequiredPercent;
            this.canAfford = canAfford;
        }

        public double getSpeedSetting() {
            return speedSetting;
        }

        public void setSpeedSetting(double speedSetting) {
            this.speedSetting = speedSetting;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public double getFuelRequiredPercent() {
            return fuelRequiredPercent;
        }
        public void setFuelRequiredPercent(double fuelRequiredPercent) {
            this.fuelRequiredPercent = fuelRequiredPercent;
        }

        public boolean isCanAfford() {
            return canAfford;
        }

        public void setCanAfford(boolean canAfford) {
            this.canAfford = canAfford;
        }
    }
}
