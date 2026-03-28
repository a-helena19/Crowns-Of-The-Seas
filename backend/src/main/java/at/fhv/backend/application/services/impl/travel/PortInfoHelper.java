package at.fhv.backend.application.services.impl.travel;

import java.util.UUID;

// Ship kennt Port nicht. Habe hier mal ein Interface. Die echten Methoden werden dann aktualisiert
public interface PortInfoHelper {
    boolean portExists(UUID portId);
    double getDistance(UUID originPortId, UUID destinationPortId);
    UUID getDefaultStartPortId();
    UUID getPortIdForShip(UUID shipId);
    int getDistanceInTicks(UUID originPortId, UUID destinationPortId);
}
