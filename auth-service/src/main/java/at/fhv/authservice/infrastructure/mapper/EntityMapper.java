package at.fhv.authservice.infrastructure.mapper;

public interface EntityMapper<Domain, Entity> {
    Entity toJpaEntity(Domain domainModel);
    Domain toDomainModel(Entity jpaEntity);
}
