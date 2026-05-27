export type ObstacleMinigameOutcome = "SUCCESS" | "FAILED";
export type ObstacleFailureReason = "TIME_OUT" | "SHIP_DESTROYED" | "DECLINED";
export type ObstacleRouteViewType = "VIEW_A" | "VIEW_B";

export interface ObstacleMinigameConfig {
    eventId?: string;
    travelId: string;
    timeLimitSeconds: number;
    startHealth: number;
    routeViewType: ObstacleRouteViewType;
    shipIconUrl?: string;
    onFinished?: (result: ObstacleMinigameResult) => void;
}

export interface ObstacleMinigameResult {
    eventType: "OBSTACLE";
    result: ObstacleMinigameOutcome;
    remainingHealth: number;
    timeLeftSeconds: number;
    timeLimitSeconds: number;
    routeViewType: ObstacleRouteViewType;
    failureReason?: ObstacleFailureReason;
    eventId?: string;
    travelId: string;
}

export interface ObstacleMinigameEventPayload {
    eventId: string;
    eventType: "OBSTACLE";
    playerId: string;
    sessionId: string;
    travelId: string;
    playerShipId: string;
    timeLimitSeconds: number;
    startHealth: number;
    originPortId?: string;
    originPortName?: string;
    destinationPortId?: string;
    destinationPortName?: string;
    routeViewType?: ObstacleRouteViewType;
    shipIconUrl?: string;
}
