package at.fhv.backend.rest.dtos.websocket;

public class TreasureHuntMinigameEvent {
    private final String eventId;
    private final String eventType;
    private final String playerId;
    private final String sessionId;
    private final String travelId;
    private final String playerShipId;
    private final int timeLimitSeconds;
    private final int requiredTreasures;
    private final int pirateCount;

    public TreasureHuntMinigameEvent(String eventId, String playerId, String sessionId, String travelId, String playerShipId,
                                     int timeLimitSeconds, int requiredTreasures, int pirateCount) {
        this.eventId = eventId;
        this.eventType = "TREASURE_HUNT";
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.timeLimitSeconds = timeLimitSeconds;
        this.requiredTreasures = requiredTreasures;
        this.pirateCount = pirateCount;
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

    public int getRequiredTreasures() {
        return requiredTreasures;
    }

    public int getPirateCount() {
        return pirateCount;
    }
}
