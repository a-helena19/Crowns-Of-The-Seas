package at.fhv.authservice.rest.dtos.user;

import jakarta.validation.constraints.NotBlank;

public class DeleteAccountRequestDTO {
    @NotBlank(message = "Password is required to confirm account deletion.")
    private String currentPassword;

    public DeleteAccountRequestDTO() {
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
