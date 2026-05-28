package at.fhv.backend.application.services.pilotstrike;

import at.fhv.backend.domain.model.pilotstrike.PilotStrike;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;

import java.util.List;
import java.util.UUID;

public interface PilotStrikeService {
    void processTick(UUID sessionId, int currentTick);

    /**
     * Overload that accepts pre-loaded data to avoid redundant DB queries during tick processing.
     */
    void processTick(UUID sessionId, int currentTick, List<PortResponseDTO> allPorts, List<Travel> activeTravels);

    boolean isStrikeActive(UUID sessionId, UUID portId);

    List<PilotStrike> getActiveStrikes(UUID sessionId);
}