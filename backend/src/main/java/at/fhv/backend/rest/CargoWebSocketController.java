package at.fhv.backend.rest;

import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.websocket.CargoMarketUpdateEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
public class CargoWebSocketController {
    private final CargoQueryService cargoQueryService;
    private final SimpMessagingTemplate messaging;

    public CargoWebSocketController(CargoQueryService cargoQueryService, SimpMessagingTemplate messaging) {
        this.cargoQueryService = cargoQueryService;
        this.messaging = messaging;
    }

    public void broadcastMarketUpdate(UUID sessionId) {
        try {
            List<SessionCargoDTO> available = cargoQueryService.getAvailableCargosBySession(sessionId);
            messaging.convertAndSend(
                    "/topic/session/" + sessionId + "/cargo",
                    new CargoMarketUpdateEvent(available)
            );
        } catch (Exception e) {
            System.err.println("Failed to broadcast cargo update for session " + sessionId + ": " + e.getMessage());
        }
    }
}