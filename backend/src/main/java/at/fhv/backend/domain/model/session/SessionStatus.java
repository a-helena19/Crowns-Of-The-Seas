package at.fhv.backend.domain.model.session;

public enum SessionStatus {
    LOBBY,
    RUNNING,
    FINISHED;

    public boolean canTransitionTo(SessionStatus next) {
        return switch (this) {
            case LOBBY    -> next == RUNNING;
            case RUNNING  -> next == FINISHED;
            case FINISHED -> false;
        };
    }
}
