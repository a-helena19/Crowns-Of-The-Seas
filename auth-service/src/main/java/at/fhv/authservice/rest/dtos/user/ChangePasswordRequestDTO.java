package at.fhv.authservice.rest.dtos.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequestDTO {
    @NotBlank(message = "Current password cannot be blank.")
    private String currentPassword;

    @NotBlank(message = "New password cannot be blank.")
    @Size(min = 8, max = 255, message = "Password length must be between 8 and 255.")
    private String newPassword;

    public ChangePasswordRequestDTO() {
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
