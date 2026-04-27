package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.init.CargoSessionInitializer;
import at.fhv.backend.application.services.travel.CargoUnloadService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.travel.Travel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class CargoUnloadServiceImpl implements CargoUnloadService {

    private final SessionCargoRepository sessionCargoRepository;
    private final Random rng = new Random();

    public CargoUnloadServiceImpl(SessionCargoRepository sessionCargoRepository) {
        this.sessionCargoRepository = sessionCargoRepository;
    }

    @Override
    @Transactional
    public void unloadCargoForTravel(Travel travel) {
        // Find all cargo assigned to the player
        List<SessionCargo> assignedCargos = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());

        for (SessionCargo cargo : assignedCargos) {
            // Check if cargo belongs to this ship and is destined for this port
            if (isCargoForThisTravel(cargo, travel)) {
                // Unload the cargo
                unloadCargo(cargo, travel);
            }
        }
    }

    private boolean isCargoForThisTravel(SessionCargo cargo, Travel travel) {
        return cargo.getAssignedPlayerShipId() != null
                && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId())
                && cargo.getDestinationPortId().equals(travel.getDestinationPortId())
                && cargo.getCargoStatus() == CargoStatus.ASSIGNED;
    }

    private void unloadCargo(SessionCargo cargo, Travel travel) {
        cargo.deliver();

        // Calculate cooldown based on cargo type
        int cooldown = CargoSessionInitializer.randomizedCooldownFor(cargo.getCargoType(), rng);
        cargo.startCooldown(travel.getArrivalTick() + cooldown);

        sessionCargoRepository.save(cargo);
    }
}