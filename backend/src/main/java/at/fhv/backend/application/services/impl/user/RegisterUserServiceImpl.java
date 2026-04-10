package at.fhv.backend.application.services.impl.user;

import at.fhv.backend.application.dtos.mapper.UserDTOMapper;
import at.fhv.backend.application.dtos.request.RegisterUserDTO;
import at.fhv.backend.application.dtos.response.UserResponseDTO;
import at.fhv.backend.application.services.user.RegisterUserService;
import at.fhv.backend.config.JwtService;
import at.fhv.backend.domain.model.exception.UsernameTakenException;
import at.fhv.backend.domain.model.user.User;
import at.fhv.backend.domain.model.user.UserRepository;
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
            String token = jwtService.generateToken(saved.getId(), saved.getUsername());
            return userDTOMapper.toResponseDTO(saved, token);
        } catch (DataIntegrityViolationException e) {
            throw new UsernameTakenException(request.getUsername());
        }
    }
}
