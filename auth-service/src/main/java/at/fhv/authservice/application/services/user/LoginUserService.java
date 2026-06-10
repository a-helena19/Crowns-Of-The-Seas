package at.fhv.authservice.application.services.user;

import at.fhv.authservice.rest.dtos.user.LoginUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;

public interface LoginUserService {
    UserResponseDTO login(LoginUserDTO request);
}
