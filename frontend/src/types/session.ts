// SessionDTO
export interface SessionDTO {
    id: string;
    gameCode: string;
    status: SessionStatus;
    maxPlayers: number;
    tickRateSeconds: number;
    players: SessionPlayerDTO[];
}

// SessionPlayerDTO
export interface SessionPlayerDTO {
    id: string;
    userId: string;
    playerName: string;
    isHost: boolean;
    faction: string | null;
}

// Request DTOs
export interface CreateSessionRequest {
    hostUserId: string;
    hostName: string;
    maxPlayers: number;
    tickRateSeconds: number;
    duration: string; // ISO 8601 Duration
}

export interface JoinSessionRequest {
    gameCode: string;
    userId: string;
    playerName: string;
}

export interface StartGameRequest {
    hostUserId: string;
}

// Status Type (not enum due to erasableSyntaxOnly)
export type SessionStatus = "LOBBY" | "RUNNING" | "FINISHED";

export const SESSION_STATUS = {
    LOBBY: "LOBBY" as SessionStatus,
    RUNNING: "RUNNING" as SessionStatus,
    FINISHED: "FINISHED" as SessionStatus
} as const;
