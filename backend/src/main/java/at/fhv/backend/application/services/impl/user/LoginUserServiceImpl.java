package at.fhv.backend.application.services.impl.user;

import at.fhv.backend.application.dtos.mapper.UserDTOMapper;
import at.fhv.backend.application.dtos.request.LoginUserDTO;
import at.fhv.backend.application.dtos.response.UserResponseDTO;
import at.fhv.backend.application.services.user.LoginUserService;
import at.fhv.backend.config.JwtService;
import at.fhv.backend.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.backend.domain.model.user.User;
import at.fhv.backend.domain.model.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginUserServiceImpl implements LoginUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDTOMapper userDTOMapper;
    private final JwtService jwtService;

    public LoginUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                UserDTOMapper userDTOMapper, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDTOMapper = userDTOMapper;
        this.jwtService = jwtService;
    }

    @Override
    public UserResponseDTO login(LoginUserDTO request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user.getId(), user.getUsername());
        return userDTOMapper.toResponseDTO(user, token);
    }
}
