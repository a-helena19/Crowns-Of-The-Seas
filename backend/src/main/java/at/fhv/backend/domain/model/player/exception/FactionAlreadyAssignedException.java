package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class FactionAlreadyAssignedException extends DomainException {
    public FactionAlreadyAssignedException(UUID userId) {
        super("Player " + userId + " has already chosen a faction",
                ErrorCode.FACTION_ALREADY_ASSIGNED);
    }
}
