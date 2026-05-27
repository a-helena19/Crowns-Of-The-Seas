package at.fhv.backend.rest.dtos.websocket;

public class StormMinigameEvent {
    private final String eventId;
    private final String eventType;
    private final String playerId;
    private final String sessionId;
    private final String travelId;
    private final String playerShipId;
    private final int timeLimitSeconds;
    private final int requiredSuns;
    private final int startHealth;

    public StormMinigameEvent(String eventId, String playerId, String sessionId, String travelId,
                              String playerShipId, int timeLimitSeconds, int requiredSuns, int startHealth) {
        this.eventId = eventId;
        this.eventType = "STORM";
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.timeLimitSeconds = timeLimitSeconds;
        this.requiredSuns = requiredSuns;
        this.startHealth = startHealth;
    }

    public String getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getTravelId() {
        return travelId;
    }

    public String getPlayerShipId() {
        return playerShipId;
    }

    public int getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public int getRequiredSuns() {
        return requiredSuns;
    }

    public int getStartHealth() {
        return startHealth;
    }
}

