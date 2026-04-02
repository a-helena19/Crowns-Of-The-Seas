package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SessionNotRunningException extends DomainException {
    public SessionNotRunningException(UUID sessionId) {
        super("Session " + sessionId + " is not Running",
                ErrorCode.SESSION_NOT_RUNNING);
    }
}
