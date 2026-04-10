package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.application.dtos.response.UserResponseDTO;
import at.fhv.backend.domain.model.user.User;

public interface UserDTOMapper {
    UserResponseDTO toResponseDTO(User user, String token);
}
