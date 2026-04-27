package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.travel.Travel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RewardCalculationServiceImpl implements RewardCalculationService {

    private final SessionCargoRepository sessionCargoRepository;

    public RewardCalculationServiceImpl(SessionCargoRepository sessionCargoRepository) {
        this.sessionCargoRepository = sessionCargoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateTotalReward(Travel travel) {
        BigDecimal totalReward = BigDecimal.ZERO;

        // Get all cargo assigned to the player
        List<SessionCargo> assignedCargos = sessionCargoRepository.findByAssignedPlayerId(travel.getPlayerId());

        for (SessionCargo cargo : assignedCargos) {
            // Only count cargo that was delivered on this specific travel
            if (isCargoDeliveredOnThisTravel(cargo, travel)) {
                BigDecimal cargoReward = calculateCargoReward(cargo.getReward());
                totalReward = totalReward.add(cargoReward);
            }
        }

        // Add travel base reward if any
        if (travel.getBaseReward() != null && travel.getBaseReward().compareTo(BigDecimal.ZERO) > 0) {
            totalReward = totalReward.add(travel.getBaseReward());
        }

        return totalReward.max(BigDecimal.ZERO); // Never return negative
    }

    @Override
    public BigDecimal calculateCargoReward(BigDecimal baseReward) {
        if (baseReward == null || baseReward.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // expired cargo reward will come later

        return baseReward;
    }

    private boolean isCargoDeliveredOnThisTravel(SessionCargo cargo, Travel travel) {
        return cargo.getAssignedPlayerShipId() != null
                && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId())
                && cargo.getDestinationPortId().equals(travel.getDestinationPortId())
                && cargo.getCargoStatus() == CargoStatus.DELIVERED;
    }
}