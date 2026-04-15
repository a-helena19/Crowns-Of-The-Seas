package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.ship.request.LoginUserDTO;
import at.fhv.backend.rest.dtos.ship.request.RegisterUserDTO;
import at.fhv.backend.rest.dtos.ship.response.UserResponseDTO;
import at.fhv.backend.application.services.user.LoginUserService;
import at.fhv.backend.application.services.user.RegisterUserService;
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
