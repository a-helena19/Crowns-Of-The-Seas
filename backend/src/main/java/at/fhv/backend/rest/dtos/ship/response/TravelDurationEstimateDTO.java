package at.fhv.backend.rest.dtos.ship.response;

import java.util.List;

public record TravelDurationEstimateDTO(List<SpeedDurationOption> options) {
    public record SpeedDurationOption(double speedSetting, String label, int durationTicks) {}
}
