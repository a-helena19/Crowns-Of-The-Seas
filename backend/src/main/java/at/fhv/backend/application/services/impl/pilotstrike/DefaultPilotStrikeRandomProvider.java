package at.fhv.backend.application.services.impl.pilotstrike;

import at.fhv.backend.application.services.pilotstrike.PilotStrikeRandomProvider;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class DefaultPilotStrikeRandomProvider implements PilotStrikeRandomProvider {

    private final Random random = new Random();

    @Override
    public double nextStartRoll() {
        return random.nextDouble();
    }

    @Override
    public int nextDurationOffset(int bound) {
        return random.nextInt(bound);
    }

    @Override
    public int nextPortIndex(int bound) {
        return random.nextInt(bound);
    }
}
