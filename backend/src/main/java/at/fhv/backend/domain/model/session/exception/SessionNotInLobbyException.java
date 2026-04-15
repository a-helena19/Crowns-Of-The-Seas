package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SessionNotInLobbyException extends DomainException {
    public SessionNotInLobbyException(UUID sessionId) {
        super("Session " + sessionId + " is not in LOBBY",
                ErrorCode.SESSION_NOT_IN_LOBBY);
    }
}