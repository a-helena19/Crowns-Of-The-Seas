package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.travel.Travel;

import java.math.BigDecimal;

public interface RewardCalculationService {
    BigDecimal calculateTotalReward(Travel travel);
    BigDecimal calculateCargoReward(BigDecimal cargoReward);
}
