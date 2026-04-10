import { useEffect, useState } from "react";
import "../style/selectship.css";

interface PlayerShip {
    id: string;
    name: string;
    fuel: number;
    condition: string;
    status: string;
    iconUrl?: string;
}

export default function ShipScreen({
                                       onSelect,
                                   }: {
    onSelect: (ship: PlayerShip) => void;
}) {
    const [ships, setShips] = useState<PlayerShip[]>([]);
    const [loading, setLoading] = useState(true);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;

    useEffect(() => {
        if (!playerId) {
            setLoading(false);
            return;
        }
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        if (!sessionId) {
            setLoading(false);
            return;
        }
        fetch(`http://localhost:8080/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}` }
        })
            .then(res => res.json())
            .then(data => {
                setShips(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="ship-screen">
            <div className="ship-market-container">

                <h2 className="ship-title">Schiff auswählen</h2>

                {loading && <p className="ship-status">Lade Schiffe...</p>}

                {!loading && ships.length === 0 && (
                    <p className="ship-status">Keine Schiffe vorhanden</p>
                )}

                {!loading && ships.map(ship => (
                    <div
                        key={ship.id}
                        className="ship-card"
                        onClick={() => onSelect(ship)}
                    >
                        <img
                            src={
                                ship.iconUrl
                                    ? `http://localhost:8080${ship.iconUrl}`
                                    : "/fallback-ship.png"
                            }
                            alt={ship.name}
                        />

                        <div className="ship-card-info">
                            <div className="ship-card-title">{ship.name}</div>

                            <div className="ship-card-desc">
                                Zustand: {ship.condition}
                            </div>

                            <div className="ship-card-desc">
                                Status: {ship.status}
                            </div>
                        </div>

                        <div className="ship-card-meta">
                            <div className="ship-card-fuel">
                                {ship.fuel}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}