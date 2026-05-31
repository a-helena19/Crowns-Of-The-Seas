export type TreasureHuntMinigameOutcome = "SUCCESS" | "FAILED" | "DECLINED";

export interface TreasureHuntMinigameConfig {
    eventId?: string;
    travelId: string;
    timeLimitSeconds: number;
    requiredTreasures: number;
    pirateCount: number;
    shipIconUrl?: string;
    onFinished?: (result: TreasureHuntMinigameResult) => void;
}

export interface TreasureHuntMinigameResult {
    eventType: "TREASURE_HUNT";
    result: TreasureHuntMinigameOutcome;
    collectedTreasures: number;
    requiredTreasures: number;
    timeLeftSeconds: number;
    timeLimitSeconds: number;
    eventId?: string;
    travelId: string;
}

export interface TreasureHuntMinigameEventPayload {
    eventId: string;
    eventType: "TREASURE_HUNT";
    playerId: string;
    sessionId: string;
    travelId: string;
    playerShipId: string;
    timeLimitSeconds: number;
    requiredTreasures: number;
    pirateCount: number;
    shipIconUrl?: string;
}
