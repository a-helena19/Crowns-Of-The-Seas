package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.application.dtos.response.UserResponseDTO;
import at.fhv.backend.domain.model.user.User;
import org.springframework.stereotype.Component;

@Component
public class UserDTOMapperImpl implements UserDTOMapper {
    @Override
    public UserResponseDTO toResponseDTO(User user, String token) {
        return new UserResponseDTO(user.getId(), user.getUsername(), token);
    }
}
