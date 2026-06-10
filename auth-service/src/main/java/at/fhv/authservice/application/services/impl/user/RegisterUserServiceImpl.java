package at.fhv.authservice.application.services.impl.user;

import at.fhv.authservice.application.dtos.mapper.UserDTOMapper;
import at.fhv.authservice.application.services.user.RegisterUserService;
import at.fhv.authservice.config.JwtService;
import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.domain.model.user.UserRepository;
import at.fhv.authservice.domain.model.user.exception.UsernameTakenException;
import at.fhv.authservice.rest.dtos.user.RegisterUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class RegisterUserServiceImpl implements RegisterUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDTOMapper userDTOMapper;
    private final JwtService jwtService;

    public RegisterUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                   UserDTOMapper userDTOMapper, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDTOMapper = userDTOMapper;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public UserResponseDTO register(RegisterUserDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameTakenException(request.getUsername());
        }
        UUID id = UUID.randomUUID();
        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = User.register(id, request.getUsername(), passwordHash);
        try {
            User saved = userRepository.save(user);
            String token = jwtService.generateToken(saved.getId(), saved.getUsername(), saved.getRole());
            return userDTOMapper.toResponseDTO(saved, token);
        } catch (DataIntegrityViolationException e) {
            throw new UsernameTakenException(request.getUsername());
        }
    }
}
