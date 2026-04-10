package at.fhv.backend.domain.model.player.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class InvalidFactionException extends DomainException {
  public InvalidFactionException(String faction) {
    super("Invalid faction: " + faction,
            ErrorCode.INVALID_FACTION);
  }
}
