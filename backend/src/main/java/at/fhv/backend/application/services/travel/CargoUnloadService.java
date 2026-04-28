package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.travel.Travel;

import java.util.List;

public interface CargoUnloadService {
    void unloadCargoForTravel(Travel travel, List<SessionCargo> assignedCargos);
}
