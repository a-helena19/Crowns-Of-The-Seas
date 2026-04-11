package at.fhv.backend.domain.model.session.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class PlayerAlreadyInSessionException extends DomainException {
    public PlayerAlreadyInSessionException(UUID sessionId, UUID userId) {
        super("Player " + userId + " is already in session " + sessionId,
                ErrorCode.PLAYER_ALREADY_IN_SESSION);
    }
}

