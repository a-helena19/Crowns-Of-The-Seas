package at.fhv.backend.application.services.travel;

import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.travel.Travel;

import java.math.BigDecimal;
import java.util.List;

public interface RewardCalculationService {
    BigDecimal calculateTotalReward(Travel travel, List<SessionCargo> cargos);
    BigDecimal calculateCargoReward(SessionCargo cargo);
    BigDecimal calculateBonus(BigDecimal cargoReward);
}