package at.fhv.backend.domain.model.user;

import java.util.Optional;

public interface UserRepository {
    User save(User user);

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);
}
