package at.fhv.backend.rest.dtos.websocket;

public record TickUpdateEvent(
        String eventType,
        int currentTick,
        int totalTicks
) {
    public TickUpdateEvent(int currentTick, int totalTicks) {
        this("TICK_UPDATE", currentTick, totalTicks);
    }
}
