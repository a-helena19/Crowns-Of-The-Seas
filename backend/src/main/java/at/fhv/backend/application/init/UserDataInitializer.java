package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.user.User;
import at.fhv.backend.domain.model.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class UserDataInitializer implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD = "12345678";
    private static final String DEFAULT_ADMIN_PASSWORD = "admin1234";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> usernames = List.of("testuser1", "testuser2", "testuser3", "testuser4");

        for (String username : usernames) {
            if (userRepository.existsByUsername(username)) {
                continue;
            }

            User user = User.register(
                    UUID.randomUUID(),
                    username,
                    passwordEncoder.encode(DEFAULT_PASSWORD)
            );
            userRepository.save(user);
        }

        if (!userRepository.existsByUsername("admin")) {
            User admin = User.registerAdmin(
                    UUID.randomUUID(),
                    "admin",
                    passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD)
            );
            userRepository.save(admin);
        }
    }
}
