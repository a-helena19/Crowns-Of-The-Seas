package at.fhv.authservice.infrastructure.mapper;

import at.fhv.authservice.domain.model.user.User;
import at.fhv.authservice.infrastructure.persistence.user.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper implements EntityMapper<User, UserEntity> {
    @Override
    public UserEntity toJpaEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setUsername(user.getUsername());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setRole(user.getRole());
        return entity;
    }

    @Override
    public User toDomainModel(UserEntity entity) {
        return User.reconstruct(
                entity.getId(),
                entity.getUsername(),
                entity.getPasswordHash(),
                entity.getRole()
        );
    }
}
