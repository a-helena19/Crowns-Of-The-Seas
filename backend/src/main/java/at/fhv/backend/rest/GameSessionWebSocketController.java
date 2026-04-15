package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.websocket.PortsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.ShipPositionsUpdateEvent;
import at.fhv.backend.rest.dtos.websocket.TickUpdateEvent;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameSessionWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public GameSessionWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/session/{sessionId}/subscribe")
    public void subscribeToSession(@DestinationVariable String sessionId) {
        // Just subscribe, backend will push updates when events happen
    }

    public void broadcastSessionUpdate(String sessionId, SessionUpdateEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, event);
    }

    public void broadcastPortsUpdate(String sessionId, PortsUpdateEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/ports", event);
    }

    public void broadcastTickUpdate(String sessionId, TickUpdateEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/tick", event);
    }

    public void broadcastShipPositions(String sessionId, ShipPositionsUpdateEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/ships", event);
    }
}

