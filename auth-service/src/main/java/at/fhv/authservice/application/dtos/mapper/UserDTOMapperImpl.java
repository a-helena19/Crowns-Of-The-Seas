package at.fhv.authservice.application.dtos.mapper;

import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class UserDTOMapperImpl implements UserDTOMapper {
    @Override
    public UserResponseDTO toResponseDTO(User user, String token) {
        return new UserResponseDTO(user.getId(), user.getUsername(), token, user.getRole());
    }
}
