package at.fhv.backend.application.services.impl.travel;

import org.springframework.stereotype.Service;

import java.util.UUID;

// dummy daten, wird später gelöscht
@Service
public class PortInfoHelperImpl implements  PortInfoHelper {
    @Override
    public boolean portExists(UUID portId) {
        return true;
    }

    @Override
    public double getDistance(UUID originPortId, UUID destinationPortId) {
        return 5.0;
    }

    @Override
    public UUID getDefaultStartPortId() {
        return UUID.randomUUID();
    }

    @Override
    public UUID getPortIdForShip(UUID shipId) {
        return UUID.randomUUID();
    }

    @Override
    public int getDistanceInTicks(UUID originPortId, UUID destinationPortId) {
        return 5;
    }
}
