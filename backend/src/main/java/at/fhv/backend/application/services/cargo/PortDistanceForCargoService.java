package at.fhv.backend.application.services.cargo;

import java.util.UUID;

public interface PortDistanceForCargoService {
    double distanceBetween(UUID originPortId, UUID destinationPortId);
}
