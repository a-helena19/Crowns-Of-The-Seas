package at.fhv.authservice.rest.dtos.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangeUsernameRequestDTO {
    @NotBlank(message = "New username cannot be blank.")
    @Size(min = 1, max = 128, message = "Username length must be between 1 and 128.")
    private String newUsername;

    @NotBlank(message = "Current password cannot be blank.")
    private String currentPassword;

    public ChangeUsernameRequestDTO() {
    }

    public String getNewUsername() {
        return newUsername;
    }

    public void setNewUsername(String newUsername) {
        this.newUsername = newUsername;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
