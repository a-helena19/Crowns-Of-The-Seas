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
    public void unloadCargoForTravel(Travel travel, List<SessionCargo> assignedCargos) {
        for (SessionCargo cargo : assignedCargos) {
            if (isCargoForThisTravel(cargo, travel)) {
                unloadCargo(cargo, travel);
            }
        }
    }

    private boolean isCargoForThisTravel(SessionCargo cargo, Travel travel) {
        boolean isForThisShipAndPort = cargo.getAssignedPlayerShipId() != null
                && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId())
                && cargo.getDestinationPortId().equals(travel.getDestinationPortId());

        boolean isAssignedOrExpired = cargo.getCargoStatus() == CargoStatus.ASSIGNED
                || cargo.getCargoStatus() == CargoStatus.EXPIRED;

        return isForThisShipAndPort && isAssignedOrExpired;
    }

    private void unloadCargo(SessionCargo cargo, Travel travel) {
        if (cargo.getCargoStatus() == CargoStatus.ASSIGNED) {
            cargo.deliver();
        }

        int cooldown = CargoSessionInitializer.randomizedCooldownFor(cargo.getCargoType(), rng);
        cargo.startCooldown(travel.getArrivalTick() + cooldown);

        sessionCargoRepository.save(cargo);
    }
}