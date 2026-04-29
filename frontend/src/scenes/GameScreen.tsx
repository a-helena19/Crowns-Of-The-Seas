import { useEffect, useCallback, useState } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import SideBar from "../components/SideBar";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";
import PortProfileScreen from "../scenes/PortProfileScreen.tsx";
import TravelNotification from "../components/TravelNotification.tsx";
import { useGameSessionWebSocket } from "../hooks/useGameSessionWebSocket.ts";

export const TOP_BAR_HEIGHT = '8vh';
export const BOTTOM_BAR_HEIGHT = '25vh';

interface CargoRewardBreakdown {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    percentage: number;
    status: "DELIVERED" | "EXPIRED";
    cargoType: string;
}

interface TravelCompleteEvent {
    travelId: string;
    playerId: string;
    cargoRewards: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
}

interface UnloadingState {
    portName: string;
    completedAtTick: number;
    cargoCount: number;
}

export default function GameScreen() {
    const [view, setView] = useState<"map" | "harbor" | "broker" | "portProfile">("map");
    const [selectedPort, setSelectedPort] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

    // Travel/Unloading State auf höchster Ebene, damit Notification überall sichtbar ist
    const [unloadingState, setUnloadingState] = useState<UnloadingState | null>(null);
    const [currentTick, setCurrentTick] = useState(0);
    const [travelResult, setTravelResult] = useState<TravelCompleteEvent | null>(null);

    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const tickRateSeconds: number = sessionData ? (JSON.parse(sessionData).tickRateSeconds ?? 30) : 30;

    const userData = localStorage.getItem('crowns_user');
    const playerId: string | null = userData ? JSON.parse(userData).id : null;

    useEffect(() => {
        if (typeof window.__tickRateMs !== 'number' || !Number.isFinite(window.__tickRateMs) || window.__tickRateMs <= 0) {
            window.__tickRateMs = tickRateSeconds * 1000;
        }
    }, [tickRateSeconds]);

    useEffect(() => {
        const onPortClicked = (e: Event) => {
            const port = (e as CustomEvent).detail;
            setSelectedPort(port);
            setView("portProfile");
        };
        window.addEventListener('port-clicked', onPortClicked);
        return () => window.removeEventListener('port-clicked', onPortClicked);
    }, []);
    
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ currentTick: number; ships: any[] }>).detail;
            setCurrentTick(detail.currentTick);

            const myShip = detail.ships.find(s =>
                s.playerId === playerId && s.status === 'UNLOADING'
            );
            if (myShip && myShip.arrivalTick != null) {
                const port = window.__latestPorts?.find((p: any) => p.id === myShip.currentPortId);
                setUnloadingState(prev => ({
                    portName: port?.name ?? prev?.portName ?? "Hafen",
                    completedAtTick: myShip.arrivalTick,
                    cargoCount: prev?.cargoCount ?? 0,
                }));
            }
        };
        window.addEventListener('backend-ship-positions', handler);
        return () => window.removeEventListener('backend-ship-positions', handler);
    }, [playerId]);

    useEffect(() => {
        const handleTravelComplete = (event: Event) => {
            const data = (event as CustomEvent<TravelCompleteEvent>).detail;
            if (data.playerId !== playerId) return; // nur eigene Reisen anzeigen
            setTravelResult(data);
            setUnloadingState(null); // Unloading-Phase beendet
            window.dispatchEvent(new CustomEvent('player-balance-updated'));
        };

        window.addEventListener('travel-complete', handleTravelComplete);
        return () => window.removeEventListener('travel-complete', handleTravelComplete);
    }, [playerId]);

    const handleSessionUpdate = useCallback(() => {}, []);

    const { isConnected, stompClient } = useGameSessionWebSocket({
        sessionId,
        onSessionUpdate: handleSessionUpdate,
    });

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        fetch('/api/ports', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(ports => {
                window.__latestPorts = ports;
                window.dispatchEvent(new CustomEvent('backend-ports', { detail: ports }));
            })
            .catch(err => console.error('Failed to load ports:', err));
    }, []);

    const send = useCallback((message: object) => {
        if (!stompClient?.connected) return;
        stompClient.send('/app/game', {}, JSON.stringify(message));
    }, [stompClient]);

    return (
        <div className={`app-layout ${view}`}>
            <div className="top"><TopBar /></div>
            <div className="game"><Game view={view} /></div>
            <div className={`fullscreen-overlay ${(view === "harbor" || view === "broker") ? "open" : "closed"}`}>
                {view === "harbor" && <HarborScene onClose={() => setView("map")} />}
                {view === "broker" && <ShipBrokerScene onClose={() => setView("map")} />}
            </div>
            {view === "portProfile" && selectedPort && (
                <PortProfileScreen port={selectedPort} onClose={() => setView("map")} />
            )}
            {(view === "map" || view === "portProfile") && (
                <div className="sidebar">
                    <SideBar
                        currentView={view}
                        onStartAction={() => setView("harbor")}
                        onOpenBroker={() => setView("broker")}
                    />
                </div>
            )}
            {(view === "map" || view === "portProfile") && (
                <div className="bottom">
                    <BottomBar send={send} connected={isConnected} />
                </div>
            )}

            {/* Notification rechts unten — sichtbar in allen Views */}
            <TravelNotification
                unloadingState={unloadingState}
                currentTick={currentTick}
                travelResult={travelResult}
                onResultDismiss={() => setTravelResult(null)}
            />
        </div>
    );
}