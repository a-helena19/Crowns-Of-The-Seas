package at.fhv.backend.application.services.user;

import at.fhv.backend.rest.dtos.ship.request.RegisterUserDTO;
import at.fhv.backend.rest.dtos.ship.response.UserResponseDTO;

public interface RegisterUserService {
    UserResponseDTO register(RegisterUserDTO request);
}
