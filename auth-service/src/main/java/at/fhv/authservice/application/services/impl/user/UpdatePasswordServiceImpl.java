package at.fhv.authservice.application.services.impl.user;

import at.fhv.authservice.application.services.user.UpdatePasswordService;
import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.domain.model.user.UserRepository;
import at.fhv.authservice.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.authservice.domain.model.user.exception.UserNotFoundException;
import at.fhv.authservice.rest.dtos.user.ChangePasswordRequestDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UpdatePasswordServiceImpl implements UpdatePasswordService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UpdatePasswordServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void updatePassword(UUID userId, ChangePasswordRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String newHash = passwordEncoder.encode(request.getNewPassword());
        userRepository.save(user.withPassword(newHash));
    }
}
