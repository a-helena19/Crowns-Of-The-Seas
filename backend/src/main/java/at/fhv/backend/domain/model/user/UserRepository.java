package at.fhv.backend.domain.model.user;

public interface UserRepository {
    User save(User user);

    boolean existsByUsername(String username);
}
