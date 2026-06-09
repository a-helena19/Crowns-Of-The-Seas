package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.RewardCalculationService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.travel.Travel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;

@Service
public class RewardCalculationServiceImpl implements RewardCalculationService {

    private static final double MAX_BONUS_FACTOR = 0.50;
    private final Random random = new Random();

    @Override
    public BigDecimal calculateTotalReward(Travel travel, List<SessionCargo> cargos) {

        BigDecimal totalReward = BigDecimal.ZERO;

        for (SessionCargo cargo : cargos) {
            if (isCargoRelevantForThisTravel(cargo, travel)) {
                BigDecimal cargoReward = calculateCargoReward(cargo);
                totalReward = totalReward.add(cargoReward);
            }
        }

        return roundToWholeThaler(totalReward.max(BigDecimal.ZERO));
    }
    @Override
    public BigDecimal calculateCargoReward(SessionCargo cargo) {
        if (cargo == null || cargo.getReward() == null
                || cargo.getReward().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        switch (cargo.getCargoStatus()) {
            case DELIVERED:
                return roundToWholeThaler(cargo.getReward());
            case EXPIRED:
                return calculateExpiredCargoReward(cargo);
            default:
                return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal calculateBonus(BigDecimal cargoReward) {
        if (cargoReward == null || cargoReward.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        double bonusFactor = random.nextDouble() * MAX_BONUS_FACTOR;
        return roundToWholeThaler(cargoReward.multiply(BigDecimal.valueOf(bonusFactor)));
    }

    private BigDecimal calculateExpiredCargoReward(SessionCargo cargo) {
        CargoType cargoType = cargo.getCargoType();
        BigDecimal baseReward = cargo.getReward();

        BigDecimal rewardPercentage = switch (cargoType) {
            case FOOD -> new BigDecimal("0.00");
            case HAZARDOUS -> new BigDecimal("0.00");
            case FRAGILE -> new BigDecimal("0.10");
            case ELECTRONICS -> new BigDecimal("0.15");
            case LUXURY_GOODS -> new BigDecimal("0.20");
            case GENERAL_GOODS -> new BigDecimal("0.40");
            case INDUSTRIAL_GOODS -> new BigDecimal("0.50");
        };

        return roundToWholeThaler(baseReward.multiply(rewardPercentage));
    }

    private BigDecimal roundToWholeThaler(BigDecimal amount) {
        return amount == null
                ? BigDecimal.ZERO
                : amount.setScale(0, RoundingMode.HALF_UP);
    }

    private boolean isCargoRelevantForThisTravel(SessionCargo cargo, Travel travel) {
        boolean isForThisPort = cargo.getDestinationPortId().equals(travel.getDestinationPortId());

        boolean isDeliveredOrExpired = cargo.getCargoStatus() == CargoStatus.DELIVERED
                || cargo.getCargoStatus() == CargoStatus.EXPIRED;

        return isForThisPort && isDeliveredOrExpired;
    }
}
