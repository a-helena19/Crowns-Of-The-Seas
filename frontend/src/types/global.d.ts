interface Window {
    __latestShip?: { x: number; y: number; status: string };
    __latestPorts?: Array<{ id: string; name: string; x: number; y: number }>;
    __latestTick?: { currentTick: number; totalTicks: number };
    __latestShipPositionsTick?: number;
    __tickRateMs?: number;
    __homePortId?: string;
    __activeGameView?: "map" | "marketplace" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office";
    __latestShips?: Array<{
        playerShipId: string;
        playerId: string;
        playerName: string;
        iconUrl: string;
        x: number;
        y: number;
        status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | 'READY_TO_DEPART' | 'REFUELING' | 'REPAIRING';
        arrivalTick: number | null;
        originX: number | null;
        originY: number | null;
        destX: number | null;
        destY: number | null;
        startTick: number | null;
        paused?: boolean;
    }>;
    __activeRatEventId?: string;
    __activeStormEventId?: string;
    __activeObstacleEventId?: string;
    __activeTreasureHuntEventId?: string;
}
