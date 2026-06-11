package at.fhv.authservice.application.services.impl.user;

import at.fhv.authservice.application.services.user.DeleteUserService;
import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.domain.model.user.UserRepository;
import at.fhv.authservice.domain.model.user.exception.InvalidCredentialsException;
import at.fhv.authservice.domain.model.user.exception.UserNotFoundException;
import at.fhv.authservice.rest.dtos.user.DeleteAccountRequestDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeleteUserServiceImpl implements DeleteUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DeleteUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId, DeleteAccountRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        userRepository.deleteById(userId);
    }
}
