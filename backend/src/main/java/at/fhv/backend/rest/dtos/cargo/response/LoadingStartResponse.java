package at.fhv.backend.rest.dtos.cargo.response;

public class LoadingStartResponse {
    private String cargoId;
    private double loadingDurationSeconds;
    private Integer loadingCompletedAtTick;

    public LoadingStartResponse() {}

    public String getCargoId() {
        return cargoId;
    }

    public void setCargoId(String cargoId) {
        this.cargoId = cargoId;
    }

    public double getLoadingDurationSeconds() {
        return loadingDurationSeconds;
    }

    public void setLoadingDurationSeconds(double loadingDurationSeconds) {
        this.loadingDurationSeconds = loadingDurationSeconds;
    }

    public Integer getLoadingCompletedAtTick() {
        return loadingCompletedAtTick;
    }

    public void setLoadingCompletedAtTick(Integer loadingCompletedAtTick) {
        this.loadingCompletedAtTick = loadingCompletedAtTick;
    }
}