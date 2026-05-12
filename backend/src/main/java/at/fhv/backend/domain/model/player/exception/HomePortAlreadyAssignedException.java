package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class HomePortAlreadyAssignedException extends DomainException {
    public HomePortAlreadyAssignedException(UUID playerId) {
        super(
                String.format("Home port already assigned for player: %s", playerId),
                ErrorCode.HOME_PORT_ALREADY_ASSIGNED
        );
    }
}