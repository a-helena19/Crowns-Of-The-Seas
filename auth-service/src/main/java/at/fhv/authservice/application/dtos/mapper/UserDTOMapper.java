package at.fhv.authservice.application.dtos.mapper;

import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;

public interface UserDTOMapper {
    UserResponseDTO toResponseDTO(User user, String token);
}
