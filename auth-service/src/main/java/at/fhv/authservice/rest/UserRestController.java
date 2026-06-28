package at.fhv.authservice.rest;

import at.fhv.authservice.application.services.user.DeleteUserService;
import at.fhv.authservice.application.services.user.LoginUserService;
import at.fhv.authservice.application.services.user.RegisterUserService;
import at.fhv.authservice.application.services.user.UpdatePasswordService;
import at.fhv.authservice.application.services.user.UpdateUsernameService;
import at.fhv.authservice.config.JwtService;
import at.fhv.authservice.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.authservice.rest.dtos.user.ChangePasswordRequestDTO;
import at.fhv.authservice.rest.dtos.user.ChangeUsernameRequestDTO;
import at.fhv.authservice.rest.dtos.user.DeleteAccountRequestDTO;
import at.fhv.authservice.rest.dtos.user.LoginUserDTO;
import at.fhv.authservice.rest.dtos.user.RegisterUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserRestController {
    private final RegisterUserService registerUserService;
    private final LoginUserService loginUserService;
    private final UpdateUsernameService updateUsernameService;
    private final UpdatePasswordService updatePasswordService;
    private final DeleteUserService deleteUserService;
    private final JwtService jwtService;

    public UserRestController(RegisterUserService registerUserService,
                              LoginUserService loginUserService,
                              UpdateUsernameService updateUsernameService,
                              UpdatePasswordService updatePasswordService,
                              DeleteUserService deleteUserService,
                              JwtService jwtService) {
        this.registerUserService = registerUserService;
        this.loginUserService = loginUserService;
        this.updateUsernameService = updateUsernameService;
        this.updatePasswordService = updatePasswordService;
        this.deleteUserService = deleteUserService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> register(@Valid @RequestBody RegisterUserDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registerUserService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponseDTO> login(@Valid @RequestBody LoginUserDTO request) {
        return ResponseEntity.ok(loginUserService.login(request));
    }

    @PutMapping("/me/username")
    public ResponseEntity<UserResponseDTO> changeUsername(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangeUsernameRequestDTO request) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(updateUsernameService.updateUsername(userId, request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequestDTO request) {
        UUID userId = extractUserId(authHeader);
        updatePasswordService.updatePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody DeleteAccountRequestDTO request) {
        UUID userId = extractUserId(authHeader);
        deleteUserService.deleteUser(userId, request);
        return ResponseEntity.noContent().build();
    }

    private UUID extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException();
        }
        try {
            return jwtService.extractUserId(authHeader.substring(7));
        } catch (JwtException e) {
            throw new InvalidCredentialsException();
        }
    }
}
