package at.fhv.authservice.application.services.impl.user;

import at.fhv.authservice.application.dtos.mapper.UserDTOMapper;
import at.fhv.authservice.application.services.user.UpdateUsernameService;
import at.fhv.authservice.config.JwtService;
import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.domain.model.user.UserRepository;
import at.fhv.authservice.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.authservice.domain.model.user.exception.UserNotFoundException;
import at.fhv.authservice.domain.model.user.exception.UsernameTakenException;
import at.fhv.authservice.rest.dtos.user.ChangeUsernameRequestDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UpdateUsernameServiceImpl implements UpdateUsernameService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDTOMapper userDTOMapper;
    private final JwtService jwtService;

    public UpdateUsernameServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                     UserDTOMapper userDTOMapper, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDTOMapper = userDTOMapper;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public UserResponseDTO updateUsername(UUID userId, ChangeUsernameRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (userRepository.existsByUsername(request.getNewUsername())) {
            throw new UsernameTakenException(request.getNewUsername());
        }

        try {
            User updated = userRepository.save(user.withUsername(request.getNewUsername()));
            String token = jwtService.generateToken(updated.getId(), updated.getUsername(), updated.getRole());
            return userDTOMapper.toResponseDTO(updated, token);
        } catch (DataIntegrityViolationException e) {
            throw new UsernameTakenException(request.getNewUsername());
        }
    }
}
