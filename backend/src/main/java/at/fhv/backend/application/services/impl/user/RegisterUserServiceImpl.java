package at.fhv.backend.application.services.impl.user;

import at.fhv.backend.application.dtos.request.RegisterUserDTO;
import at.fhv.backend.application.dtos.response.UserResponseDTO;
import at.fhv.backend.application.services.user.RegisterUserService;
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

    public RegisterUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
            return new UserResponseDTO(saved.getId(), saved.getUsername());
        } catch (DataIntegrityViolationException e) {
            throw new UsernameTakenException(request.getUsername());
        }
    }
}
