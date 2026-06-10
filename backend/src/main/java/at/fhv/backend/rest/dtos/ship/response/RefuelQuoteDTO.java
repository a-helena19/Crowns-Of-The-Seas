package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RefuelQuoteDTO(
        double currentFuelPercent,
        double targetFuelPercent,
        double fuelAddedPercent,
        double fuelAddedUnits,
        BigDecimal totalCost,
        BigDecimal currentBalance
) {}
