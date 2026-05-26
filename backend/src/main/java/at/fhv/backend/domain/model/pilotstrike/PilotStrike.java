package at.fhv.backend.domain.model.pilotstrike;

import java.util.UUID;

public record PilotStrike(UUID portId, String portName, int startTick, int endTick) {}
