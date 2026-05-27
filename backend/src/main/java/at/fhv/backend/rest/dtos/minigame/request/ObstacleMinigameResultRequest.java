package at.fhv.backend.rest.dtos.minigame.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ObstacleMinigameResultRequest {
    @NotNull
    private UUID eventId;

    @NotNull
    private UUID travelId;

    @NotBlank
    private String result;

    @Min(0)
    @Max(100)
    private int remainingHealth;

    @Min(0)
    @Max(600)
    private int timeLeftSeconds;

    @Min(1)
    @Max(600)
    private int timeLimitSeconds;

    private String failureReason;

    @NotBlank
    private String routeViewType;

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getTravelId() {
        return travelId;
    }

    public void setTravelId(UUID travelId) {
        this.travelId = travelId;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public int getRemainingHealth() {
        return remainingHealth;
    }

    public void setRemainingHealth(int remainingHealth) {
        this.remainingHealth = remainingHealth;
    }

    public int getTimeLeftSeconds() {
        return timeLeftSeconds;
    }

    public void setTimeLeftSeconds(int timeLeftSeconds) {
        this.timeLeftSeconds = timeLeftSeconds;
    }

    public int getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public void setTimeLimitSeconds(int timeLimitSeconds) {
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getRouteViewType() {
        return routeViewType;
    }

    public void setRouteViewType(String routeViewType) {
        this.routeViewType = routeViewType;
    }
}
