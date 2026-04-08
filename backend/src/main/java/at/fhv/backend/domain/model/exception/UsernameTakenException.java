package at.fhv.backend.domain.model.exception;

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
