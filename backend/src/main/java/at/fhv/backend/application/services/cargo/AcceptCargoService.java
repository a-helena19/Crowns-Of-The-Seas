package at.fhv.backend.application.services.cargo;

import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;

import java.util.UUID;

public interface AcceptCargoService {
    SessionCargoDTO acceptCargo(UUID playerId, UUID sessionId, AcceptCargoRequest request);
}
