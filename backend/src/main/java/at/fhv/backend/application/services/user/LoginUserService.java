package at.fhv.backend.application.services.user;

import at.fhv.backend.rest.dtos.ship.request.LoginUserDTO;
import at.fhv.backend.rest.dtos.ship.response.UserResponseDTO;

public interface LoginUserService {
    UserResponseDTO login(LoginUserDTO request);
}
