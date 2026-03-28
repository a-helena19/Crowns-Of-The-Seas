package at.fhv.backend.application.dtos.mapper;

public interface DtoMapper<Domain, Response> {
    Response toResponse(Domain domainModel);
}
