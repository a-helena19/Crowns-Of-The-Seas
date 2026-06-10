package at.fhv.authservice.application.services.user;

import at.fhv.authservice.rest.dtos.user.RegisterUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;

public interface RegisterUserService {
    UserResponseDTO register(RegisterUserDTO request);
}
