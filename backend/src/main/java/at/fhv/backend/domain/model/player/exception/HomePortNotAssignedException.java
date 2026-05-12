package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class HomePortNotAssignedException extends DomainException {
    public HomePortNotAssignedException(UUID playerId) {
        super(
                String.format("Home port not assigned for player: %s", playerId),
                ErrorCode.HOME_PORT_NOT_ASSIGNED
        );
    }
}