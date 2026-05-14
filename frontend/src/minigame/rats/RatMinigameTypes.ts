export type RatMinigameOutcome = "SUCCESS" | "FAILED";

export interface RatMinigameConfig {
    timeLimitSeconds: number;
    requiredHits: number;
    routeId?: string;
    eventId?: string;
    travelId: string;
    onFinished?: (result: RatMinigameResult) => void;
}

export interface RatMinigameResult {
    eventType: "RATS";
    result: RatMinigameOutcome;
    hits: number;
    requiredHits: number;
    remainingSeconds: number;
    timeLimitSeconds: number;
    eventId?: string;
    travelId: string;
}

export interface RatMinigameEventPayload {
    eventId: string;
    eventType: "RATS";
    playerId: string;
    sessionId: string;
    travelId: string;
    playerShipId: string;
    timeLimitSeconds: number;
    requiredHits: number;
}
