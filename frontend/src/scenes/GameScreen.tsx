import useGameWebSocket from "../hooks/useWebSocket.ts";
import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import SideBar from "../components/SideBar";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";

export const TOP_BAR_HEIGHT = '8vh';
export const BOTTOM_BAR_HEIGHT = '25vh';

export default function GameScreen() {
    const { connected, gameState, send } = useGameWebSocket();
    const [view, setView] = useState<"map" | "harbor" | "broker">("map");

    useEffect(() => {
        if (gameState?.ship) {
            window.__latestShip = gameState.ship;
            window.dispatchEvent(new CustomEvent('backend-ship-position', {
                detail: {
                    x: gameState.ship.x,
                    y: gameState.ship.y,
                    status: gameState.ship.status,
                    tickRateMs: gameState.tickRateMs
                },
            }));
        }
        if (gameState?.ports) {
            window.__latestPorts = gameState.ports;
            window.dispatchEvent(new CustomEvent('backend-ports', {
                detail: gameState.ports,
            }));
        }
    }, [gameState]);

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
                    <BottomBar send={send} connected={connected} />
                </div>
            )}
        </div>
    );
}