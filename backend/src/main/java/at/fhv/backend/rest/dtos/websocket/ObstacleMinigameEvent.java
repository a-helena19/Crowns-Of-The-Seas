package at.fhv.backend.rest.dtos.websocket;

public class ObstacleMinigameEvent {
    private final String eventId;
    private final String eventType;
    private final String playerId;
    private final String sessionId;
    private final String travelId;
    private final String playerShipId;
    private final int timeLimitSeconds;
    private final int startHealth;
    private final String originPortId;
    private final String originPortName;
    private final String destinationPortId;
    private final String destinationPortName;
    private final String routeViewType;

    public ObstacleMinigameEvent(String eventId, String playerId, String sessionId, String travelId,
                                 String playerShipId, int timeLimitSeconds, int startHealth,
                                 String originPortId, String originPortName,
                                 String destinationPortId, String destinationPortName,
                                 String routeViewType) {
        this.eventId = eventId;
        this.eventType = "OBSTACLE";
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.timeLimitSeconds = timeLimitSeconds;
        this.startHealth = startHealth;
        this.originPortId = originPortId;
        this.originPortName = originPortName;
        this.destinationPortId = destinationPortId;
        this.destinationPortName = destinationPortName;
        this.routeViewType = routeViewType;
    }

    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public String getPlayerId() { return playerId; }
    public String getSessionId() { return sessionId; }
    public String getTravelId() { return travelId; }
    public String getPlayerShipId() { return playerShipId; }
    public int getTimeLimitSeconds() { return timeLimitSeconds; }
    public int getStartHealth() { return startHealth; }
    public String getOriginPortId() { return originPortId; }
    public String getOriginPortName() { return originPortName; }
    public String getDestinationPortId() { return destinationPortId; }
    public String getDestinationPortName() { return destinationPortName; }
    public String getRouteViewType() { return routeViewType; }
}
