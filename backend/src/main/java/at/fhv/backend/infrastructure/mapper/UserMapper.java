package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.user.User;
import at.fhv.backend.infrastructure.persistence.user.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper implements EntityMapper<User, UserEntity> {
    @Override
    public UserEntity toJpaEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setUsername(user.getUsername());
        entity.setPasswordHash(user.getPasswordHash());
        return entity;
    }

    @Override
    public User toDomainModel(UserEntity entity) {
        return User.reconstruct(
                entity.getId(),
                entity.getUsername(),
                entity.getPasswordHash()
        );
    }
}
