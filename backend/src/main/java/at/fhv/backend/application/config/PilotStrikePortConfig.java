package at.fhv.backend.application.config;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class PilotStrikePortConfig {

    public record StrikeSettings(
            double startChancePerTick,
            int maxActiveStrikes,
            int minDurationTicks,
            int maxDurationTicks,
            int cooldownTicks
    ) {}

    private static final StrikeSettings SETTINGS = new StrikeSettings(0.4, 1, 5, 15, 3);

    private static final Set<String> STRIKE_ELIGIBLE_PORT_NAMES = Set.of(
            "Hamburg",
            "New York",
            "Santos",
            "Kapstadt",
            "Mumbai",
            "Singapur",
            "Shanghai",
            "Sydney",
            "Los Angeles"
    );

    public StrikeSettings getSettings() {
        return SETTINGS;
    }

    public boolean isStrikeEligible(String portName) {
        return STRIKE_ELIGIBLE_PORT_NAMES.contains(portName);
    }
}
