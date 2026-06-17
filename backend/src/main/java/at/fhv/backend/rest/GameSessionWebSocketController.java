package at.fhv.backend.rest;

import at.fhv.backend.application.services.impl.session.GameTickScheduler;
import at.fhv.backend.application.services.session.GameSessionService;
import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;
import at.fhv.backend.rest.dtos.websocket.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Controller
public class GameSessionWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameTickScheduler gameTickScheduler;
    private final GameSessionService gameSessionService;

    public GameSessionWebSocketController(SimpMessagingTemplate messagingTemplate,
                                          @Lazy GameTickScheduler gameTickScheduler,
                                          @Lazy GameSessionService gameSessionService) {
        this.messagingTemplate = messagingTemplate;
        this.gameTickScheduler = gameTickScheduler;
        this.gameSessionService = gameSessionService;
    }

    @MessageMapping("/session/{sessionId}/subscribe")
    public void subscribeToSession(@DestinationVariable String sessionId,
                                   @Payload(required = false) Map<String, Object> payload) {
        UUID sessionUuid;
        try {
            sessionUuid = UUID.fromString(sessionId);
        } catch (Exception e) {
            return; // Ungültige ID – ignorieren.
        }

        // Sobald ein Client subscribed ist, sofort den aktuellen Spielstand
        // (Schiffspositionen) senden, damit nicht bis zum nächsten Tick eine leere
        // Karte angezeigt wird.
        try {
            gameTickScheduler.triggerImmediateBroadcast(sessionUuid);
        } catch (Exception e) {
            // Subscription bleibt unberührt.
        }

        // Handelt es sich um einen Wieder-Beitritt? Dann jetzt – wo der Client
        // garantiert subscribed ist – die anderen Spieler benachrichtigen.
        if (payload != null) {
            Object rejoinedUserId = payload.get("rejoinedUserId");
            if (rejoinedUserId != null) {
                try {
                    gameSessionService.notifyPlayerRejoined(
                            sessionUuid, UUID.fromString(rejoinedUserId.toString()));
                } catch (Exception e) {
                    // Benachrichtigung ist best-effort; Fehler nicht eskalieren.
                }
            }
        }
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

    public void broadcastRatMinigameEvent(String sessionId, RatMinigameEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/rats-event", event);
    }

    public void broadcastStormMinigameEvent(String sessionId, StormMinigameEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/storm-event", event);
    }

    public void broadcastObstacleMinigameEvent(String sessionId, ObstacleMinigameEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/obstacle-event", event);
    }

    public void broadcastTreasureHuntMinigameEvent(String sessionId, TreasureHuntMinigameEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/treasure-hunt-event", event);
    }

    public void broadcastCustomsInspectionResolved(String sessionId, CustomsInspectionPassEvent event) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/customs-resolved", event);
    }

    public void broadcastChatMessage(String sessionId, ChatMessageDTO message) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/chat", message);
    }
}
