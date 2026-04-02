package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SessionFullException extends DomainException {
    public SessionFullException(UUID sessionId) {
        super("Session " + sessionId + " is full",
                ErrorCode.SESSION_FULL);
    }
}