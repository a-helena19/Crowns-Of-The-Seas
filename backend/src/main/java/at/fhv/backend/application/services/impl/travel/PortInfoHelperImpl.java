package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.port.application.PortQueryService;
import at.fhv.backend.port.application.dto.PortResponseDTO;
import at.fhv.backend.port.domain.exception.PortNotFoundException;
import at.fhv.backend.port.domain.model.PortId;
import at.fhv.backend.port.domain.repository.PortRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PortInfoHelperImpl implements PortInfoHelper {

    private final PortQueryService portQueryService;
    private final PortRepository portRepository;
    private final PlayerShipRepository playerShipRepository;

    public PortInfoHelperImpl(PortQueryService portQueryService,
                              PortRepository portRepository,
                              PlayerShipRepository playerShipRepository) {
        this.portQueryService = portQueryService;
        this.portRepository = portRepository;
        this.playerShipRepository = playerShipRepository;
    }

    @Override
    public boolean portExists(UUID portId) {
        return portRepository.existsById(PortId.of(portId));
    }

    @Override
    public double getDistance(UUID originPortId, UUID destinationPortId) {
        PortResponseDTO origin = portQueryService.findById(originPortId);
        PortResponseDTO destination = portQueryService.findById(destinationPortId);
        double dx = origin.x() - destination.x();
        double dy = origin.y() - destination.y();
        return Math.sqrt(dx * dx + dy * dy);
    }

    @Override
    public UUID getDefaultStartPortId() {
        List<PortResponseDTO> ports = portQueryService.findAll();
        if (ports.isEmpty()) {
            throw new IllegalStateException("No ports available in the system");
        }
        return ports.get(0).id();
    }

    @Override
    public UUID getPortIdForShip(UUID shipId) {
        PlayerShip playerShip = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new IllegalArgumentException("PlayerShip not found: " + shipId));
        return playerShip.getCurrentPortId();
    }

    @Override
    public int getDistanceInTicks(UUID originPortId, UUID destinationPortId) {
        double distance = getDistance(originPortId, destinationPortId);
        return (int) Math.ceil(distance);
    }
}
