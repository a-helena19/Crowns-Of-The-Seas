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
}