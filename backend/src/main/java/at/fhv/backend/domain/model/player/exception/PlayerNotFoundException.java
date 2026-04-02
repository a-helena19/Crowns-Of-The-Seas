package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class PlayerNotFoundException extends DomainException {
    public PlayerNotFoundException(UUID userId) {
        super("Player with userId " + userId + " not found",
                ErrorCode.PLAYER_NOT_FOUND);
    }
}
