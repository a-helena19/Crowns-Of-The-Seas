package at.fhv.backend.application.services.impl.travel;

import at.fhv.backend.application.services.travel.RegressService;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.customs.RegressFine;
import at.fhv.backend.domain.model.travel.Travel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RegressServiceImpl implements RegressService {
    private static final int TOLERANCE_TICKS = 1;
    private static final int CUSTOMS_CHECK_TICKS = 2;
    private static final BigDecimal DELAY_FRACTION_PER_TICK = new BigDecimal("0.08");
    private static final BigDecimal DAMAGE_RATE_PER_PERCENT = new BigDecimal("50");
    private static final BigDecimal DELAY_FRACTION_CAP = new BigDecimal("0.60");

    private final Map<UUID, Double> conditionAtStartByTravelId = new ConcurrentHashMap<>();
    private final Map<UUID, RegressFine> evaluatedFineByTravelId = new ConcurrentHashMap<>();

    @Override
    public void recordConditionAtStart(UUID travelId, double conditionAtStart) {
        conditionAtStartByTravelId.put(travelId, conditionAtStart);
        System.out.println("[Regress] Recorded condition at travel start for travel " + travelId
                + ": " + conditionAtStart + " %");
    }

    @Override
    public RegressFine evaluateAndStore(Travel travel, int currentTick, double currentCondition,
                                        List<SessionCargo> cargosForTravel) {
        RegressFine fine = evaluateInternal(travel, currentTick, currentCondition, cargosForTravel);
        evaluatedFineByTravelId.put(travel.getTravelId(), fine);
        return fine;
    }

    @Override
    public RegressFine consumeFine(Travel travel, int currentTick, double currentCondition,
                                   List<SessionCargo> cargosForTravel) {
        RegressFine stored = evaluatedFineByTravelId.remove(travel.getTravelId());
        if (stored != null) {
            return stored;
        }
        return evaluateInternal(travel, currentTick, currentCondition, cargosForTravel);
    }

    private RegressFine evaluateInternal(Travel travel, int currentTick, double currentCondition,
                                         List<SessionCargo> cargosForTravel) {

        int originalArrivalTick = travel.getOriginalArrivalTick();
        int expectedArrivalTick = originalArrivalTick + CUSTOMS_CHECK_TICKS;
        int actualArrivalTick = currentTick;
        int delayTicks = Math.max(0, actualArrivalTick - expectedArrivalTick);
        int overdueTicks = Math.max(0, delayTicks - TOLERANCE_TICKS);

        BigDecimal cargoValue = sumCargoValue(cargosForTravel);
        BigDecimal delayComponent = BigDecimal.ZERO;
        if (overdueTicks > 0 && cargoValue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rawFraction = DELAY_FRACTION_PER_TICK.multiply(BigDecimal.valueOf(overdueTicks));
            BigDecimal cappedFraction = rawFraction.min(DELAY_FRACTION_CAP);
            delayComponent = cargoValue.multiply(cappedFraction).setScale(0, RoundingMode.HALF_UP);
        }

        Double conditionAtStart = conditionAtStartByTravelId.get(travel.getTravelId());
        double damagePercent = 0.0;
        if (conditionAtStart != null) {
            damagePercent = Math.max(0.0, conditionAtStart - currentCondition);
        }
        BigDecimal damageComponent = BigDecimal.ZERO;
        if (damagePercent > 0.0) {
            damageComponent = DAMAGE_RATE_PER_PERCENT
                    .multiply(BigDecimal.valueOf(damagePercent))
                    .setScale(0, RoundingMode.HALF_UP);
        }

        SpecialCargoFlags flags = inspectCargoFlags(cargosForTravel);
        double multiplier = pickHighestMultiplier(flags);

        BigDecimal multipliedDelay = applyMultiplier(delayComponent, multiplier);
        BigDecimal multipliedDamage = applyMultiplier(damageComponent, multiplier);

        RegressFine fine = new RegressFine(
                delayTicks, TOLERANCE_TICKS,
                multipliedDelay, multipliedDamage,
                damagePercent, multiplier,
                flags.hasPerishable, flags.hasFragile
        );

        System.out.println("[Regress] Travel " + travel.getTravelId()
                + " — currentTick=" + currentTick
                + " expectedArrivalTick=" + expectedArrivalTick
                + " (originalArrivalTick=" + originalArrivalTick + " + customsCheckTicks=" + CUSTOMS_CHECK_TICKS + ")"
                + " delayTicks=" + delayTicks
                + " (tolerance=" + TOLERANCE_TICKS + ", overdue=" + overdueTicks + ")"
                + " cargoValue=" + cargoValue + " T"
                + " damage=" + String.format("%.1f", damagePercent) + "%"
                + " multiplier=" + multiplier
                + " => delayComponent=" + multipliedDelay + " T"
                + ", damageComponent=" + multipliedDamage + " T"
                + ", total=" + fine.getTotalFine() + " T");

        return fine;
    }

    @Override
    public void clear(UUID travelId) {
        conditionAtStartByTravelId.remove(travelId);
        evaluatedFineByTravelId.remove(travelId);
    }

    private BigDecimal sumCargoValue(List<SessionCargo> cargosForTravel) {
        BigDecimal sum = BigDecimal.ZERO;
        for (SessionCargo cargo : cargosForTravel) {
            BigDecimal reward = cargo.getReward();
            if (reward != null) {
                sum = sum.add(reward);
            }
        }
        return sum;
    }

    private SpecialCargoFlags inspectCargoFlags(List<SessionCargo> cargosForTravel) {
        SpecialCargoFlags flags = new SpecialCargoFlags();
        for (SessionCargo cargo : cargosForTravel) {
            CargoType type = cargo.getCargoType();
            if (type == null) continue;
            if (type == CargoType.FOOD) {
                flags.hasPerishable = true;
            } else if (type == CargoType.FRAGILE) {
                flags.hasFragile = true;
            } else if (type == CargoType.ELECTRONICS) {
                flags.hasElectronics = true;
            }
        }
        return flags;
    }

    private double pickHighestMultiplier(SpecialCargoFlags flags) {
        if (flags.hasPerishable) return 2.0;
        if (flags.hasFragile) return 1.8;
        if (flags.hasElectronics) return 1.4;
        return 1.0;
    }

    private BigDecimal applyMultiplier(BigDecimal amount, double multiplier) {
        if (amount.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return amount.multiply(BigDecimal.valueOf(multiplier)).setScale(0, RoundingMode.HALF_UP);
    }

    private static final class SpecialCargoFlags {
        boolean hasPerishable = false;
        boolean hasFragile = false;
        boolean hasElectronics = false;
    }
}