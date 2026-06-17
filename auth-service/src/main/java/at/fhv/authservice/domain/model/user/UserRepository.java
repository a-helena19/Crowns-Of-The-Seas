package at.fhv.authservice.domain.model.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    User save(User user);

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    Optional<User> findById(UUID id);

    void deleteById(UUID id);
}
