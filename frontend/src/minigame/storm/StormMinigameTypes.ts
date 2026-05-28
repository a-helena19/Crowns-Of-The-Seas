export type StormMinigameOutcome = "SUCCESS" | "FAILED";

export interface StormMinigameConfig {
    timeLimitSeconds: number;
    requiredSuns: number;
    startHealth: number;
    eventId?: string;
    travelId: string;
    shipIconUrl?: string;
    onFinished?: (result: StormMinigameResult) => void;
}

export interface StormMinigameResult {
    eventType: "STORM";
    result: StormMinigameOutcome;
    collectedSuns: number;
    requiredSuns: number;
    remainingHealth: number;
    timeLeftSeconds: number;
    timeLimitSeconds: number;
    eventId?: string;
    travelId: string;
}

export interface StormMinigameEventPayload {
    eventId: string;
    eventType: "STORM";
    playerId: string;
    sessionId: string;
    travelId: string;
    playerShipId: string;
    timeLimitSeconds: number;
    requiredSuns: number;
    startHealth: number;
    shipIconUrl?: string;
}
