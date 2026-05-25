package at.fhv.backend.rest.dtos.admin;

import java.math.BigDecimal;
import java.util.UUID;

public record AdminShipDTO(
        UUID id,
        String name,
        String description,
        String shipClass,
        BigDecimal price,
        int maxCargoCapacity,
        double maxSpeed,
        double fuelConsumption,
        BigDecimal maxFuel,
        BigDecimal operatingCost,
        double baseReliability,
        String iconUrl,
        int stock
) {}