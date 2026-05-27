package at.fhv.backend.rest.dtos.minigame.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class StormMinigameResultRequest {
    @NotNull
    private UUID eventId;

    @NotNull
    private UUID travelId;

    @NotBlank
    private String result;

    @Min(0)
    private int collectedSuns;

    @Min(1)
    private int requiredSuns;

    @Min(0)
    @Max(100)
    private int remainingHealth;

    @Min(0)
    @Max(600)
    private int timeLeftSeconds;

    @Min(1)
    @Max(600)
    private int timeLimitSeconds;

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

    public int getCollectedSuns() {
        return collectedSuns;
    }

    public void setCollectedSuns(int collectedSuns) {
        this.collectedSuns = collectedSuns;
    }

    public int getRequiredSuns() {
        return requiredSuns;
    }

    public void setRequiredSuns(int requiredSuns) {
        this.requiredSuns = requiredSuns;
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
}

