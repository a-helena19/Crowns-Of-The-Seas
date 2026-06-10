package at.fhv.authservice.rest.dtos.user;

import java.util.UUID;

public class UserResponseDTO {
    private UUID id;
    private String username;
    private String token;
    private String role;

    public UserResponseDTO() {
    }

    public UserResponseDTO(UUID id, String username, String token, String role) {
        this.id = id;
        this.username = username;
        this.token = token;
        this.role = role;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
