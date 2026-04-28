package at.fhv.backend.rest;

import at.fhv.backend.application.services.ship.ShipQueryService;
import at.fhv.backend.rest.dtos.ship.response.ShipDTO;
import at.fhv.backend.rest.dtos.websocket.ShipMarketUpdateEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
public class ShipMarketWebSocketController {
    private final ShipQueryService shipQueryService;
    private final SimpMessagingTemplate messaging;

    public ShipMarketWebSocketController(ShipQueryService shipQueryService, SimpMessagingTemplate messaging) {
        this.shipQueryService = shipQueryService;
        this.messaging = messaging;
    }

    public void broadcastStockUpdate(UUID sessionId) {
        try {
            List<ShipDTO> ships = shipQueryService.getMarketShips(null, sessionId);
            messaging.convertAndSend(
                    "/topic/session/" + sessionId + "/ships",
                    new ShipMarketUpdateEvent(ships)
            );
        } catch (Exception e) {
            System.err.println("Failed to broadcast ship market update for session " + sessionId + ": " + e.getMessage());
        }
    }
}