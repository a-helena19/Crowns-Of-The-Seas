export interface CargoRewardEntry {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    bonusReward: number;
    percentage: number;
    status: string;
    cargoType: string;
}

export interface CustomsSummary {
    outcome: "CLEARED" | "HIDDEN" | "COOPERATED" | "BRIBE_SUCCESS" | "BRIBE_FAILED";
    finePaid: number;
    bribePaid: number;
    bribeAttempted: boolean;
    detained: boolean;
    detentionTicks: number;
    wasCarryingIllegalCargo: boolean;
}

export interface RegressSummary {
    delayTicks: number;
    toleranceTicks: number;
    overdueTicks: number;
    delayComponent: number;
    damageComponent: number;
    damagePercent: number;
    specialCargoMultiplier: number;
    hadPerishableCargo: boolean;
    hadFragileCargo: boolean;
    totalFine: number;
}

export interface AssignedCargoEntry {
    cargoId: string;
    shipId: string;
    shipName: string;
    shipIconUrl?: string;
    from: string;
    to: string;
    weight: number;
    maxCargoCapacity: number;
    originPortId?: string;
    destinationPortId: string;
    speedSetting: number;
    loadingDurationSeconds: number;
    loadingStartedAt: number;
    loadingDone: boolean;
    phase: "loading" | "en_route" | "awaiting_docking" | "customs_check" | "blocked" | "unloading" | "completed";
    travelId?: string;
    currentTick?: number;
    arrivalTick?: number;
    reward?: number;
    rewardDetails?: {
        baseReward: number;
        actualReward: number;
        percentage: number;
    };
    cargoRewards?: CargoRewardEntry[];
    ratMinigameSummary?: {
        triggered: boolean;
        result?: "SUCCESS" | "FAILED";
        penaltyAmount?: number;
    };
    stormMinigameSummary?: {
        triggered: boolean;
        result?: "SUCCESS" | "FAILED";
        penaltyAmount?: number;
        cargoLossPercent?: number;
        conditionDamagePercent?: number;
    };
    obstacleMinigameSummary?: {
        triggered: boolean;
        result?: "SUCCESS" | "FAILED";
        penaltyAmount?: number;
        cargoLossPercent?: number;
        conditionDamagePercent?: number;
        failureReason?: string;
        routeViewType?: "VIEW_A" | "VIEW_B";
    };
    treasureHuntMinigameSummary?: {
        triggered: boolean;
        result?: "SUCCESS" | "FAILED" | "DECLINED";
        bonusAmount?: number;
        penaltyAmount?: number;
        cargoLossPercent?: number;
    };
    customsSummary?: CustomsSummary;
    regressSummary?: RegressSummary;
    unloadingCompletedAtTick?: number;
    startTick?: number;
    unloadingStartTick?: number;
    customsCheckStartTick?: number;
    customsCheckCompletedAtTick?: number;
    customsBlockedUntilTick?: number;
    customsBlockStartTick?: number;
    paused?: boolean;
    pilotageUsed?: boolean;
    pilotageStrikeRevoked?: boolean;
    dockingFine?: number;
    departureDockingFine?: number;
    pilotageRefund?: number;
}
