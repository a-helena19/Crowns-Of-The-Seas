package at.fhv.authservice.rest;

import at.fhv.authservice.application.services.user.LoginUserService;
import at.fhv.authservice.application.services.user.RegisterUserService;
import at.fhv.authservice.rest.dtos.user.LoginUserDTO;
import at.fhv.authservice.rest.dtos.user.RegisterUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserRestController {
    private final RegisterUserService registerUserService;
    private final LoginUserService loginUserService;

    public UserRestController(RegisterUserService registerUserService, LoginUserService loginUserService) {
        this.registerUserService = registerUserService;
        this.loginUserService = loginUserService;
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
}
