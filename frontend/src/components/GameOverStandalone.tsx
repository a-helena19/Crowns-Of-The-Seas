import {Navigate} from "react-router-dom";
import GameOverScreen from "./GameOverScreen.tsx";

export default function GameOverStandalone() {
    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;

    if (!sessionId) return <Navigate to="/lobby" />;

    return <GameOverScreen sessionId={sessionId} currentUserId={playerId} />;
}