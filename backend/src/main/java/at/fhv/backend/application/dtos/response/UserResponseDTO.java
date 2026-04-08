package at.fhv.backend.application.dtos.response;

import java.util.UUID;

public class UserResponseDTO {
    private UUID id;
    private String username;

    public UserResponseDTO() {
    }

    public UserResponseDTO(UUID id, String username) {
        this.id = id;
        this.username = username;
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
}
