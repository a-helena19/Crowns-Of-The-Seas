interface Window {
    __latestShip?: { x: number; y: number; status: string };
    __latestPorts?: Array<{ id: string; name: string; x: number; y: number }>;
    __latestTick?: { currentTick: number; totalTicks: number };
    __tickRateMs?: number;
    __latestShips?: Array<{
        playerShipId: string;
        playerId: string;
        playerName: string;
        iconUrl: string;
        x: number;
        y: number;
        status: 'EN_ROUTE' | 'AT_PORT';
        arrivalTick: number | null;
        originX: number | null;
        originY: number | null;
        destX: number | null;
        destY: number | null;
        startTick: number | null;
    }>;
}

