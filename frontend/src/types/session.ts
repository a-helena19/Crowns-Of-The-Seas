// SessionDTO
export interface SessionDTO {
    id: string;
    gameCode: string;
    status: SessionStatus;
    maxPlayers: number;
    tickRateSeconds: number;
    totalTicks: number;
    currentTick: number;
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
    hostName: string;
    maxPlayers: number;
    tickRateSeconds: number;
    totalTicks: number;
    duration: string; // ISO 8601 Duration
    // hostUserId comes from JWT in backend
}

export interface JoinSessionRequest {
    gameCode: string;
    playerName: string;
    // userId comes from JWT in backend
}

export interface StartGameRequest {
    // hostUserId comes from JWT in backend
}

// Status Type (not enum due to erasableSyntaxOnly)
export type SessionStatus = "LOBBY" | "RUNNING" | "FINISHED";

export const SESSION_STATUS = {
    LOBBY: "LOBBY" as SessionStatus,
    RUNNING: "RUNNING" as SessionStatus,
    FINISHED: "FINISHED" as SessionStatus
} as const;
