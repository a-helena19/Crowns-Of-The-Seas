package at.fhv.backend.rest.dtos.admin;

import java.math.BigDecimal;
import java.util.UUID;

public record AdminCargoDTO(
        UUID id,
        String name,
        String description,
        BigDecimal baseReward,
        int capacity,
        String cargoType,
        double risk
) {}