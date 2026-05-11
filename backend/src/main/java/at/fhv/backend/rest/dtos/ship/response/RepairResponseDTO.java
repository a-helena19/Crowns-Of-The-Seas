package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;

public record RepairResponseDTO(double currentConditionPercent, BigDecimal totalCost, BigDecimal newBalance,
                                int repairingCompletedAtTick, int repairingDurationTicks ) {}
