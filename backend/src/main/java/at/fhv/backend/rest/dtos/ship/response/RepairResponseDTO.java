package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RepairResponseDTO(double newConditionPercent, BigDecimal totalCost, BigDecimal newBalance) {}
