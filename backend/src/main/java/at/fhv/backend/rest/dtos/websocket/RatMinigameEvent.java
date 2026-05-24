package at.fhv.backend.rest.dtos.websocket;

public class RatMinigameEvent {
    private final String eventId;
    private final String eventType;
    private final String playerId;
    private final String sessionId;
    private final String travelId;
    private final String playerShipId;
    private final int timeLimitSeconds;
    private final int requiredHits;

    public RatMinigameEvent(String eventId, String playerId, String sessionId, String travelId, String playerShipId,
                            int timeLimitSeconds, int requiredHits) {
        this.eventId = eventId;
        this.eventType = "RATS";
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.timeLimitSeconds = timeLimitSeconds;
        this.requiredHits = requiredHits;
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

    public int getRequiredHits() {
        return requiredHits;
    }
}
