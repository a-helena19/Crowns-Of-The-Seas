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
    phase: "loading" | "en_route" | "unloading" | "completed";
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
    unloadingCompletedAtTick?: number;
    startTick?: number;
    unloadingStartTick?: number;
    paused?: boolean;
}
