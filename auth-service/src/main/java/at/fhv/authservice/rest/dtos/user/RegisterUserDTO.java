package at.fhv.authservice.rest.dtos.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterUserDTO {
    @NotBlank(message = "Username cannot be blank.")
    @Size(min = 1, max = 128, message = "Username length must be between 1 and 128.")
    private String username;

    @NotBlank(message = "Password cannot be blank.")
    @Size(min = 8, max = 255, message = "Password length must be between 8 and 255.")
    private String password;

    public RegisterUserDTO() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
