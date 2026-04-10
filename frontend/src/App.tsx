import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameLobby from './pages/GameLobby';
import GameScreen from './pages/GameScreen';
import JoinSessionPage from './pages/JoinSessionPage';
import './App.css';
import useGameWebSocket from "./hooks/useWebSocket.ts";
import {useEffect, useState} from "react";
import TopBar from "./components/TopBar.tsx";
import Game from "./Game.tsx";
import BottomBar from "./components/BottomBar.tsx";
import SideBar from "./components/SideBar";
import HarborScene from "./scenes/HarborScene.tsx";
import ShipBrokerScene from "./scenes/ShipBrokerScene.tsx";


function App() {
  return (
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/join/:code" element={
                <JoinSessionPage />
              } />
              <Route path="/lobby" element={
                <ProtectedRoute><GameLobby /></ProtectedRoute>
              } />
              <Route path="/game" element={
                <ProtectedRoute><GameScreen /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/lobby" />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>


  );
export const TOP_BAR_HEIGHT = '8vh';
export const BOTTOM_BAR_HEIGHT = '25vh';
export default function App() {
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
            <div className="top">
                <TopBar />
            </div>

            <div className="game">
                <Game view={view} />
            </div>
            <div className={`fullscreen-overlay ${view !== "map" ? "open" : "closed"}`}>
                {view === "harbor" && (
                    <HarborScene onClose={() => setView("map")} />
                )}
                {view === "broker" && (
                    <ShipBrokerScene onClose={() => setView("map")} />
                )}
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