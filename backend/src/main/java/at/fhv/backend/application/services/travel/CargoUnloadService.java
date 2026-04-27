package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.travel.Travel;

public interface CargoUnloadService {
    void unloadCargoForTravel(Travel travel);
}
