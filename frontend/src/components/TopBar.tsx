import { TOP_BAR_HEIGHT } from '../scenes/GameScreen';
import { useEffect, useState } from 'react';

export default function TopBar() {
    const [balance, setBalance] = useState<number | null>(null);
    const [shipCount, setShipCount] = useState<number | null>(null);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;
    const token = localStorage.getItem('auth_token') ?? '';
    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    useEffect(() => {
        if (!playerId || !sessionId) return;

        const fetchPlayerData = () => {
            fetch(`http://localhost:8080/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setBalance(Number(data)))
                .catch(() => setBalance(null));

            fetch(`http://localhost:8080/api/ships/player/${playerId}?sessionId=${sessionId}`, {
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

    return (
        <div style={{
            height: TOP_BAR_HEIGHT,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0a1628 0%, #132744 50%, #0d1f3c 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px 4px rgba(0,0,0,0.6)',
            zIndex: 1,
        }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span>💵 {balance !== null ? balance.toLocaleString('de') : '...'}</span>
                <span>🚢 {shipCount !== null ? `${shipCount} Schiff${shipCount !== 1 ? 'e' : ''}` : '...'}</span>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    ⏱ 00:00 - 1/1/2026
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button style={{ ...btnStyle, fontSize: '18px', padding: '6px 10px' }}>⚙️</button>
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid white',
    borderRadius: '20px',
    padding: '6px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 500,
};