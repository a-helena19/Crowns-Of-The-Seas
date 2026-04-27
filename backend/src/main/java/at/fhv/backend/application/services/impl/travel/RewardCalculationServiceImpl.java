package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;
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
            // Count cargo that was delivered or expired on this specific travel
            if (isCargoRelevantForThisTravel(cargo, travel)) {
                BigDecimal cargoReward = calculateCargoReward(cargo);
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
    public BigDecimal calculateCargoReward(SessionCargo cargo) {
        if (cargo == null || cargo.getReward() == null
                || cargo.getReward().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        switch (cargo.getCargoStatus()) {
            case DELIVERED:
                return cargo.getReward(); // 100%

            case EXPIRED:
                return calculateExpiredCargoReward(cargo); // Typ-abhängig

            default:
                return BigDecimal.ZERO;
        }
    }

    private BigDecimal calculateExpiredCargoReward(SessionCargo cargo) {
        CargoType cargoType = cargo.getCargoType();
        BigDecimal baseReward = cargo.getReward();

        BigDecimal rewardPercentage = switch (cargoType) {
            // --- VERDERBLICHE WAREN: TOTALVERLUST ---
            case FOOD -> new BigDecimal("0.00");
            case HAZARDOUS -> new BigDecimal("0.00");

            // --- EMPFINDLICHE WAREN: STARK BESCHÄDIGT ---
            case FRAGILE -> new BigDecimal("0.10");      // 10%
            case ELECTRONICS -> new BigDecimal("0.15");  // 15%
            case LUXURY_GOODS -> new BigDecimal("0.20"); // 20%

            // --- ROBUSTE WAREN: NOCH TEILWEISE BRAUCHBAR ---
            case GENERAL_GOODS -> new BigDecimal("0.40");      // 40%
            case INDUSTRIAL_GOODS -> new BigDecimal("0.50");   // 50%
        };

        return baseReward.multiply(rewardPercentage);
    }

    private boolean isCargoRelevantForThisTravel(SessionCargo cargo, Travel travel) {
        boolean isForThisShipAndPort = cargo.getAssignedPlayerShipId() != null
                && cargo.getAssignedPlayerShipId().equals(travel.getPlayerShipId())
                && cargo.getDestinationPortId().equals(travel.getDestinationPortId());

        boolean isDeliveredOrExpired = cargo.getCargoStatus() == CargoStatus.DELIVERED
                || cargo.getCargoStatus() == CargoStatus.EXPIRED;

        return isForThisShipAndPort && isDeliveredOrExpired;
    }
}