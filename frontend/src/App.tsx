import './App.css';
import useGameWebSocket from "./hooks/useWebSocket.ts";
import {useEffect} from "react";
import TopBar from "./components/TopBar.tsx";
import Game from "./Game.tsx";
import BottomBar from "./components/BottomBar.tsx";


export const TOP_BAR_HEIGHT = '8vh';
export const BOTTOM_BAR_HEIGHT = '25vh';

export default function App() {
    const { connected, gameState, send } = useGameWebSocket();

    useEffect(() => {
        if (gameState?.ship) {
            window.__latestShip = gameState.ship;
            window.dispatchEvent(new CustomEvent('backend-ship-position', {
                detail: { x: gameState.ship.x, y: gameState.ship.y, status: gameState.ship.status, tickRateMs: gameState.tickRateMs },
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
        <>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
                <TopBar />
                <Game />
                <BottomBar send={send} connected={connected} />
            </div>
        </>
    );
}

