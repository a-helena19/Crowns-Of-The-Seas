package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RepairQuoteDTO(
        double currentConditionPercent,
        double repairNeededPercent,
        BigDecimal totalCost,
        BigDecimal currentBalance
) {}
