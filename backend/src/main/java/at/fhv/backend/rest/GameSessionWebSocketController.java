package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.websocket.SessionUpdateEvent;
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
}

