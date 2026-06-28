package at.fhv.backend.rest;

import at.fhv.backend.application.services.chat.SessionChatService;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.session.exception.SessionNotRunningException;
import at.fhv.backend.rest.dtos.chat.request.CreateChatMessageRequest;
import at.fhv.backend.rest.dtos.chat.response.ChatMessageDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{sessionId}/chat")
public class SessionChatRestController {

    private final SessionChatService sessionChatService;

    public SessionChatRestController(SessionChatService sessionChatService) {
        this.sessionChatService = sessionChatService;
    }

    @GetMapping
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable UUID sessionId,
                                                            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            return ResponseEntity.ok(sessionChatService.getMessages(sessionId, userId));
        } catch (SessionNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (SessionNotRunningException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (PlayerNotFoundException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> postMessage(@PathVariable UUID sessionId,
                                         HttpServletRequest request,
                                         @RequestBody CreateChatMessageRequest createRequest) {
        UUID userId = (UUID) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            ChatMessageDTO message = sessionChatService.postMessage(sessionId, userId, createRequest.messageText());
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SessionNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (SessionNotRunningException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (PlayerNotFoundException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
