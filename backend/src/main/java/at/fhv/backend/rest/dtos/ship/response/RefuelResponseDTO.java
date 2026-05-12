package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RefuelResponseDTO(double currentFuelPercent, BigDecimal totalCost, BigDecimal newBalance,
                                int refuelingCompletedAtTick, int refuelingDurationTicks) {}
