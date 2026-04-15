package at.fhv.backend.infrastructure.mapper;

public interface EntityMapper<Domain, Entity> {
    Entity toJpaEntity(Domain domainModel);
    Domain toDomainModel(Entity jpaEntity);
}
