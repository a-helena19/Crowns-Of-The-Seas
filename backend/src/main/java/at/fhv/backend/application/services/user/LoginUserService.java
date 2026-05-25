package at.fhv.backend.application.services.user;

import at.fhv.backend.rest.dtos.user.LoginUserDTO;
import at.fhv.backend.rest.dtos.user.UserResponseDTO;

public interface LoginUserService {
    UserResponseDTO login(LoginUserDTO request);
}
