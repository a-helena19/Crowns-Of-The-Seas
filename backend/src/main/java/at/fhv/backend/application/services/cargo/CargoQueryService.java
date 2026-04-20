package at.fhv.backend.application.services.cargo;

import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;

import java.util.List;
import java.util.UUID;

public interface CargoQueryService {
    List<SessionCargoDTO> getAvailableCargos(UUID sessionId, UUID portId);
    List<SessionCargoDTO> getAvailableCargosBySession(UUID sessionId);
    SessionCargoDTO getCargoById(UUID sessionCargoId);

}
