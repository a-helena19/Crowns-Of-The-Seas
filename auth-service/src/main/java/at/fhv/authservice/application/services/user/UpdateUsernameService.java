package at.fhv.authservice.application.services.user;

import at.fhv.authservice.rest.dtos.user.ChangeUsernameRequestDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;

import java.util.UUID;

public interface UpdateUsernameService {
    UserResponseDTO updateUsername(UUID userId, ChangeUsernameRequestDTO request);
}
