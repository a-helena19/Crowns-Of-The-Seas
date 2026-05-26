package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.websocket.*;
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

    public void broadcastTravelComplete(String sessionId, TravelCompleteEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/travel-complete", event);
    }

    public void broadcastSmuggleOffer(String sessionId, SmuggleOfferEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/smuggle-offer", event);
    }

    public void broadcastTravelResumed(String sessionId, TravelResumedEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/travel-resumed", event);
    }

    public void broadcastCustomsInspectionDialog(String sessionId, CustomsInspectionDialogEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/customs-inspection", event);
    }

    public void broadcastCustomsInspectionPass(String sessionId, CustomsInspectionPassEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/customs-pass", event);
    }

    public void broadcastPilotStrike(String sessionId, PilotStrikeEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/pilot-strike", event);
    }
}

    public void broadcastCustomsInspectionResolved(String sessionId, CustomsInspectionPassEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/customs-resolved", event);
    }

    public void broadcastRatMinigameEvent(String sessionId, RatMinigameEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/rats-event", event);
    }
}
