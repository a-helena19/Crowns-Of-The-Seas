package at.fhv.backend.domain.model.user.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

public class UsernameTakenException extends DomainException {
    private final String username;

    public UsernameTakenException(String username) {
        super("Username is already taken: " + username, ErrorCode.USERNAME_ALREADY_EXISTS);
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}
