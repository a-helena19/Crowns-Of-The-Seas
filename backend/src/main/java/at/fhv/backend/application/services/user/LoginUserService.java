package at.fhv.backend.application.services.user;

import at.fhv.backend.application.dtos.request.LoginUserDTO;
import at.fhv.backend.application.dtos.response.UserResponseDTO;

public interface LoginUserService {
    UserResponseDTO login(LoginUserDTO request);
}
