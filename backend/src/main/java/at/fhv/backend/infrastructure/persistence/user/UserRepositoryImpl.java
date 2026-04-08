package at.fhv.backend.infrastructure.persistence.user;

import at.fhv.backend.domain.model.user.User;
import at.fhv.backend.domain.model.user.UserRepository;
import at.fhv.backend.infrastructure.mapper.UserMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UserJpaRepository userJpaRepository;
    private final UserMapper userMapper;

    public UserRepositoryImpl(UserJpaRepository userJpaRepository, UserMapper userMapper) {
        this.userJpaRepository = userJpaRepository;
        this.userMapper = userMapper;
    }

    @Override
    public User save(User user) {
        return userMapper.toDomainModel(
                userJpaRepository.save(userMapper.toJpaEntity(user))
        );
    }

    @Override
    public boolean existsByUsername(String username) {
        return userJpaRepository.existsByUsername(username);
    }
}
