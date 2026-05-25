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
    destinationPortId: string;
    speedSetting: number;
    loadingDurationSeconds: number;
    loadingStartedAt: number;
    loadingDone: boolean;
    phase: "loading" | "en_route" | "customs_check" | "unloading" | "completed";
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
    customsSummary?: CustomsSummary;
    regressSummary?: RegressSummary;
    unloadingCompletedAtTick?: number;
    startTick?: number;
    unloadingStartTick?: number;
    customsCheckStartTick?: number;
    customsCheckCompletedAtTick?: number;
    paused?: boolean;
}