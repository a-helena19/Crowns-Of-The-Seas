package at.fhv.authservice.domain.model.user.exception;

import at.fhv.authservice.domain.model.exception.DomainException;
import at.fhv.authservice.domain.model.exception.ErrorCode;

public class UserNotFoundException extends DomainException {
    public UserNotFoundException() {
        super("User not found.", ErrorCode.USER_NOT_FOUND);
    }
}
