package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class FactionAlreadyAssignedException extends DomainException {

    public FactionAlreadyAssignedException(UUID playerId) {
        super(
                String.format("Faction already assigned for player: %s", playerId),
                ErrorCode.FACTION_ALREADY_ASSIGNED
        );
    }
}