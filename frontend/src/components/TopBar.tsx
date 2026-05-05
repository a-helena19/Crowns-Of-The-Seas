import { TOP_BAR_HEIGHT } from '../scenes/GameScreen';
import { useEffect, useState } from 'react';
import '../style/topbar.css';
import moneyIcon from "../assets/icon-money.png";
import timeIcon from "../assets/icon-clock.png";
import shipIcon from "../assets/icon-ship.png";


export default function TopBar() {
    const [balance, setBalance] = useState<number | null>(null);
    const [shipCount, setShipCount] = useState<number | null>(null);
    const [currentTick, setCurrentTick] = useState<number | null>(null);
    const [totalTicks, setTotalTicks] = useState<number | null>(null);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;
    const token = localStorage.getItem('auth_token') ?? '';
    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    useEffect(() => {
        if (!playerId || !sessionId) return;

        const fetchPlayerData = () => {
            fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setBalance(Number(data)))
                .catch(() => setBalance(null));

            fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setShipCount(data.length))
                .catch(() => setShipCount(null));
        };

        fetchPlayerData();

        window.addEventListener('player-balance-updated', fetchPlayerData);
        return () => window.removeEventListener('player-balance-updated', fetchPlayerData);
    }, [playerId, sessionId, token]);

    useEffect(() => {
        if (window.__latestTick) {
            setCurrentTick(window.__latestTick.currentTick);
            setTotalTicks(window.__latestTick.totalTicks);
        }

        const handleTick = (e: Event) => {
            const { currentTick, totalTicks } = (e as CustomEvent).detail;
            setCurrentTick(currentTick);
            setTotalTicks(totalTicks);
        };

        window.addEventListener('backend-tick', handleTick);
        return () => window.removeEventListener('backend-tick', handleTick);
    }, []);

    return (
        <div className="topbar-container" style={{ height: TOP_BAR_HEIGHT }}>
            <div className="topbar-left">
                <div className="topbar-panel">
                    <img src={moneyIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        {balance !== null ? balance.toLocaleString('de') : '...'} T
                    </span>
                </div>
                <div className="topbar-panel">
                    <img src={shipIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        {shipCount !== null ? `${shipCount} Schiffe` : '...'}
                    </span>
                </div>
            </div>

            <div className="topbar-center">
                <div className="topbar-panel">
                    <img src={timeIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        Tag {currentTick !== null ? currentTick : '1'}
                        {totalTicks !== null && (
                            <span className="topbar-total"> / {totalTicks}</span>
                        )}
                    </span>
                </div>
            </div>

            <div className="topbar-right" />
        </div>
    );
}