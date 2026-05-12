package at.fhv.backend.domain.model.session;

public enum SessionStatus {
    LOBBY,
    FACTION_SELECTION,
    RUNNING,
    FINISHED;

    public boolean canTransitionTo(SessionStatus next) {
        return switch (this) {
            case LOBBY    -> next == FACTION_SELECTION;
            case FACTION_SELECTION -> next == RUNNING;
            case RUNNING  -> next == FINISHED;
            case FINISHED -> false;
        };
    }
}
