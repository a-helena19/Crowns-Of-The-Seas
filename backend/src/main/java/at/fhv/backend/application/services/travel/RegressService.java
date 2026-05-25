package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.customs.RegressFine;
import at.fhv.backend.domain.model.travel.Travel;

import java.util.List;
import java.util.UUID;

public interface RegressService {
    void recordConditionAtStart(UUID travelId, double conditionAtStart);
    void clear(UUID travelId);
    RegressFine consumeFine(Travel travel, int currentTick, double currentCondition, List<SessionCargo> cargosForTravel);
    RegressFine evaluateAndStore(Travel travel, int currentTick, double currentCondition,
                                 List<SessionCargo> cargosForTravel);

    RegressFine addDetentionDelay(UUID travelId, int additionalDelayTicks);
}
