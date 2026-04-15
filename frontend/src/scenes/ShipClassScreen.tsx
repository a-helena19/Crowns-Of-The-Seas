import { useEffect, useState } from "react";
import GameButton from "../components/GameButton";
import "../style/harbor.css";
import "../style/shipbroker.css";
import "../style/shipclass.css"
import backIcon from "../assets/goback.png";

interface Ship {
    id: string;
    name: string;
    description: string;
    shipClass: string;
    price: number;

    maxSpeed: number;
    maxCargoCapacity: number;
    maxFuel: number;
    fuelConsumption: number;
    baseReliability: number;
    operatingCost: number;

    iconUrl: string;
}

interface Props {
    shipClass: "BUDGET" | "STANDARD" | "PREMIUM";
    onBack: () => void;
}


export default function ShipClassScreen({ shipClass, onBack }: Props) {
    const [ships, setShips] = useState<Ship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;

    useEffect(() => {
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        if (!sessionId || !playerId) return;

        fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}` }
        })
            .then(res => res.json())
            .then(data => setBalance(Number(data)))
            .catch(() => setBalance(null));
    }, [playerId]);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(`/api/ships?shipClass=${shipClass}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Fehler beim Laden");
                return res.json();
            })
            .then((data: Ship[]) => {
                setShips(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Schiffe konnten nicht geladen werden.");
                setLoading(false);
            });
    }, [shipClass]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }
    async function handleBuy(ship: Ship) {
        setBuyingId(ship.id);
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        if (!sessionId || !playerId) {
            showToast("Session nicht gefunden.");
            setBuyingId(null);
            return;
        }

        try {
            const res = await fetch(
                `/api/ships/buy/${playerId}?sessionId=${sessionId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
                    },
                    body: JSON.stringify({
                        shipId: ship.id,
                    }),
                }
            );

            if (!res.ok) throw new Error();

            const data = await res.json();

            setBoughtIds(prev => new Set(prev).add(ship.id));
            setBalance(prev => prev !== null ? prev - ship.price : null);
            window.dispatchEvent(new CustomEvent('player-balance-updated')); // ← neu
            showToast(`${ship.name} gekauft!`);

            console.log("Gekauft:", data);
        } catch {
            showToast("Kauf fehlgeschlagen.");
        } finally {
            setBuyingId(null);
        }
    }

    return (
        <div className="shipclass-scene">

            <div className="back-icon-btn" onClick={onBack}>
                <img src={backIcon} alt="Zurück" />
            </div>

            <div className="shipclass-title-area">
                <div className="shipclass-title-main">Schiffsmarkt</div>
                <div className="shipclass-title-sub">
                    {formatShipClass(shipClass)} · Wähle dein Schiff
                </div>

                <div className="shipclass-ornament">
                    <div className="shipclass-orn-line" />
                    <div className="shipclass-orn-diamond" />
                    <div className="shipclass-orn-line" />
                </div>
            </div>

            {/* STATUS */}
            {loading && <p className="shipclass-status">Lade Schiffe…</p>}
            {error && <p className="shipclass-status">{error}</p>}

            {!loading && !error && ships.length === 0 && (
                <p className="shipclass-status">Keine Schiffe verfügbar.</p>
            )}

            {/* GRID */}
            <div className="ship-grid-wrapper">
                <div className="ship-grid">
                    {ships.map(ship => {
                        const canAfford = balance !== null ? balance >= ship.price : false;
                        const bought = boughtIds.has(ship.id);

                        return (
                            <div key={ship.id} className="ship-listing-card">
                                <div className="ship-listing-img-wrap">
                                    <img
                                        src={ship.iconUrl}
                                        alt={ship.name}
                                        className="ship-listing-img"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/fallback-ship.png"; // local placeholder
                                        }}
                                    />
                                </div>

                                <div className="ship-listing-info">
                                    <div className="ship-listing-name">{ship.name}</div>
                                    <div className="ship-listing-desc">{ship.description}</div>

                                    <div className="ship-listing-stats">
                                        <StatRow label="Geschwindigkeit" value={`${ship.maxSpeed} kn`} />
                                        <StatRow label="Kapazität" value={`${ship.maxCargoCapacity} t`} />
                                        <StatRow label="Tank" value={`${ship.maxFuel} t`} />
                                        <StatRow label="Verbrauch" value={`${ship.fuelConsumption} t/d`} />
                                        <StatRow label="Betriebskosten" value={`${ship.operatingCost}`} />
                                        <StatRow label="Zuverlässigkeit" value={`${Math.round(ship.baseReliability * 100)}%`} />
                                    </div>

                                    <div className="ship-listing-footer">
                                <span className="ship-listing-price">
                                    {ship.price.toLocaleString("de")}
                                </span>

                                        <GameButton
                                            onClick={() => handleBuy(ship)}
                                            disabled={!canAfford || bought || buyingId === ship.id}
                                        >
                                            {bought
                                                ? "Gekauft"
                                                : buyingId === ship.id
                                                    ? "..."
                                                    : !canAfford
                                                        ? "Zu teuer"
                                                        : "Kaufen"}
                                        </GameButton>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {toast && <div className="shipclass-toast">{toast}</div>}
        </div>
    );
}

/* HELPER */
function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="stat-row">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
        </div>
    );
}

function formatShipClass(shipClass: string) {
    const map: Record<string, string> = {
        BUDGET: "Budget-Klasse",
        STANDARD: "Standard-Klasse",
        PREMIUM: "Premium-Klasse",
    };

    return map[shipClass] ?? shipClass;
}