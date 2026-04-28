package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.travel.Travel;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CargoUnloadingPhaseService {

    BigDecimal completeUnloadingPhase(Travel travel, List<SessionCargo> cargosForPlayer);

    boolean isUnloadingComplete(UUID playerId, UUID playerShipId, int currentTick);
}