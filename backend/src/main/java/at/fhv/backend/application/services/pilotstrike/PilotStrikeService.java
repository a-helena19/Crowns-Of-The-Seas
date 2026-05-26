package at.fhv.backend.application.services.pilotstrike;

import at.fhv.backend.domain.model.pilotstrike.PilotStrike;

import java.util.List;
import java.util.UUID;

public interface PilotStrikeService {
    void processTick(UUID sessionId, int currentTick);

    boolean isStrikeActive(UUID sessionId, UUID portId);

    List<PilotStrike> getActiveStrikes(UUID sessionId);
}
