package at.fhv.backend.application.services.pilotstrike;

public interface PilotStrikeRandomProvider {
    double nextStartRoll();

    int nextDurationOffset(int bound);

    int nextPortIndex(int bound);
}
