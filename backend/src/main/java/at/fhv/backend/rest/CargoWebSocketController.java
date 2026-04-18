package at.fhv.backend.rest;

import at.fhv.backend.application.services.cargo.AcceptCargoService;
import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.domain.model.cargo.exception.CargoCapacityExceededException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.dtos.websocket.CargoMarketUpdateEvent;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.support.NativeMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.security.Principal;

@Controller
public class CargoWebSocketController {
    private final AcceptCargoService acceptCargoService;
    private final CargoQueryService cargoQueryService;
    private final SimpMessagingTemplate messaging;

    public CargoWebSocketController(AcceptCargoService acceptCargoService, CargoQueryService cargoQueryService, SimpMessagingTemplate messaging) {
        this.acceptCargoService = acceptCargoService;
        this.cargoQueryService = cargoQueryService;
        this.messaging = messaging;
    }

    @MessageMapping("/cargo/{sessionId}/accept")
    public void acceptCargo(@DestinationVariable String sessionId,
                            @Payload AcceptCargoRequest request,
                            SimpMessageHeaderAccessor headerAccessor) {

        String playerIdStr = (String) headerAccessor.getSessionAttributes()
                .getOrDefault("playerId", null);

        if (playerIdStr == null) {
            String authHeader = headerAccessor.getFirstNativeHeader("Authorization");
            messaging.convertAndSendToUser(
                    headerAccessor.getSessionId(),
                    "/queue/cargo/error",
                    "Not authenticated",
                    MessageHeaderAccessor.getAccessor(headerAccessor.getMessageHeaders(), NativeMessageHeaderAccessor.class) != null ? new HashMap<>() : new HashMap<>()
            );
            return;
        }

        UUID playerId = UUID.fromString(playerIdStr);
        UUID sessionUUID = UUID.fromString(sessionId);

        try {
            SessionCargoDTO accepted = acceptCargoService.acceptCargo(playerId, sessionUUID, request);

            // Reply to the player who accepted
            messaging.convertAndSendToUser(
                    headerAccessor.getSessionId(),
                    "/queue/cargo/accepted",
                    accepted
            );
            broadcastMarketUpdate(sessionUUID);

        } catch (CargoNotAvailableException e) {
            messaging.convertAndSendToUser(headerAccessor.getSessionId(),
                    "/queue/cargo/error",
                    "CARGO_TAKEN: This cargo was just taken by another captain."
            );
        } catch (CargoCapacityExceededException e) {
            messaging.convertAndSendToUser(headerAccessor.getSessionId(),
                    "/queue/cargo/error",
                    "CAPACITY_EXCEEDED: Your ship is too small for this cargo."
            );
        } catch (Exception e) {
            messaging.convertAndSendToUser(headerAccessor.getSessionId(),
                    "/queue/cargo/error",
                    "ERROR: " + e.getMessage()
            );
        }
    }

    public void broadcastMarketUpdate(UUID sessionId) {
        try {
            List<SessionCargoDTO> available = cargoQueryService.getAvailableCargos(sessionId);
            messaging.convertAndSend(
                    "/topic/session/" + sessionId + "/cargo",
                    new CargoMarketUpdateEvent(available)
            );
        } catch (Exception e) {
            System.err.println("Failed to broadcast cargo update for session " + sessionId + ": " + e.getMessage());
        }
    }
}
