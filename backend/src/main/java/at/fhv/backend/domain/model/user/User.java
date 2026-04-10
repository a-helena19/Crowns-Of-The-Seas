package at.fhv.backend.domain.model.user;

import java.util.UUID;

public class User {
    private final UUID id;
    private final String username;
    private final String passwordHash;

    private User(UUID id, String username, String passwordHash) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public static User register(UUID id, String username, String passwordHash) {
        return new User(id, username, passwordHash);
    }

    public static User reconstruct(UUID id, String username, String passwordHash) {
        return new User(id, username, passwordHash);
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }
}
