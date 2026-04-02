package at.fhv.backend.domain.model.exception;

public enum ErrorCode {
    // Player
    PLAYER_NOT_FOUND,
    FACTION_ALREADY_ASSIGNED,
    INVALID_FACTION,
    PLAYER_INSUFFICIENT_FUNDS,
    INVALID_AMOUNT,

    // Session
    SESSION_NOT_FOUND,
    SESSION_FULL,
    SESSION_NOT_IN_LOBBY,
    SESSION_NOT_RUNNING,
    ONLY_HOST_CAN_START,
    INVALID_TICK_RATE
}
