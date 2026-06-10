package at.fhv.authservice.domain.model.user;

import java.util.UUID;

public class User {
    private final UUID id;
    private final String username;
    private final String passwordHash;
    private final String role;

    private User(UUID id, String username, String passwordHash, String role) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public static User register(UUID id, String username, String passwordHash) {
        return new User(id, username, passwordHash, "USER");
    }

    public static User registerAdmin(UUID id, String username, String passwordHash) {
        return new User(id, username, passwordHash, "ADMIN");
    }

    public static User reconstruct(UUID id, String username, String passwordHash, String role) {
        return new User(id, username, passwordHash, role);
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

    public String getRole() {
        return role;
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
