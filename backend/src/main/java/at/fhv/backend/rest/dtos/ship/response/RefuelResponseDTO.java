package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RefuelResponseDTO(double newFuelPercent, BigDecimal totalCost, BigDecimal newBalance) {}
