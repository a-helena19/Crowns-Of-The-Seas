package at.fhv.backend.application.services.user;

import at.fhv.backend.application.dtos.request.RegisterUserDTO;
import at.fhv.backend.application.dtos.response.UserResponseDTO;

public interface RegisterUserService {
    UserResponseDTO register(RegisterUserDTO request);
}
