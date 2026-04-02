package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SessionNotFoundException extends DomainException {
    public SessionNotFoundException(UUID sessionId) {
        super("Session with id " + sessionId + " not found",
                ErrorCode.SESSION_NOT_FOUND);
    }
}