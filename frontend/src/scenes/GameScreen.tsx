import { useEffect, useCallback, useState } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import SideBar from "../components/SideBar";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";
import { useGameSessionWebSocket } from "../hooks/useGameSessionWebSocket.ts";

export const TOP_BAR_HEIGHT = '8vh';
export const BOTTOM_BAR_HEIGHT = '25vh';

export default function GameScreen() {
    const [view, setView] = useState<"map" | "harbor" | "broker">("map");

    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const tickRateSeconds: number = sessionData ? (JSON.parse(sessionData).tickRateSeconds ?? 30) : 30;

    useEffect(() => {
        // Initialize fallback once; live tick measurement can refine this value later.
        if (typeof window.__tickRateMs !== 'number' || !Number.isFinite(window.__tickRateMs) || window.__tickRateMs <= 0) {
            window.__tickRateMs = tickRateSeconds * 1000;
        }
    }, [tickRateSeconds]);

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
            <div className={`fullscreen-overlay ${view !== "map" ? "open" : "closed"}`}>
                {view === "harbor" && <HarborScene onClose={() => setView("map")} />}
                {view === "broker" && <ShipBrokerScene onClose={() => setView("map")} />}
            </div>
            {view === "map" && (
                <div className="sidebar">
                    <SideBar
                        currentView={view}
                        onStartAction={() => setView("harbor")}
                        onOpenBroker={() => setView("broker")}
                    />
                </div>
            )}
            {view === "map" && (
                <div className="bottom">
                    <BottomBar send={send} connected={isConnected} />
                </div>
            )}
        </div>
    );
}
