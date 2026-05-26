package at.fhv.backend.application.services.user;

import at.fhv.backend.rest.dtos.user.RegisterUserDTO;
import at.fhv.backend.rest.dtos.user.UserResponseDTO;

public interface RegisterUserService {
    UserResponseDTO register(RegisterUserDTO request);
}
