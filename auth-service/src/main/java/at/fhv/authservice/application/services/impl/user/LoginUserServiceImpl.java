package at.fhv.authservice.application.services.impl.user;

import at.fhv.authservice.application.dtos.mapper.UserDTOMapper;
import at.fhv.authservice.application.services.user.LoginUserService;
import at.fhv.authservice.config.JwtService;
import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.domain.model.user.UserRepository;
import at.fhv.authservice.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.authservice.rest.dtos.user.LoginUserDTO;
import at.fhv.authservice.rest.dtos.user.UserResponseDTO;
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

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());
        return userDTOMapper.toResponseDTO(user, token);
    }
}
