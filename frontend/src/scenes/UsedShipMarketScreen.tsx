import { useEffect, useState } from "react";
import GameButton from "../components/GameButton";
import backIcon from "../assets/goback.png";
import "../style/shipclass.css";

interface UsedShipListing {
    id: string;
    shipId: string;
    sellerPlayerId: string;
    currentPortId: string;
    name: string;
    description: string;
    shipClass: string;
    price: number;
    fuel: number;
    condition: number;
    maxCargoCapacity: number;
    maxSpeed: number;
    fuelConsumption: number;
    maxFuel: number;
    operatingCost: number;
    baseReliability: number;
    iconUrl: string;
}

interface PurchasedShipResponse {
    id: string;
    playerId: string;
    iconUrl: string;
    currentPortId: string;
    status: string;
}

interface Props {
    onBack: () => void;
}

export default function UsedShipMarketScreen({ onBack }: Props) {
    const [ships, setShips] = useState<UsedShipListing[]>([]);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!sessionId || !playerId) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/ships/used?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            }),
            fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.json()),
        ])
            .then(([usedShips, balanceData]) => {
                setShips(usedShips);
                setBalance(Number(balanceData));
            })
            .catch(() => setError("Gebrauchte Schiffe konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [sessionId, playerId, token]);

    function showToast(message: string) {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }

    async function handleBuy(listing: UsedShipListing) {
        if (!playerId || !sessionId) return;
        setBuyingId(listing.id);
        try {
            const res = await fetch(`/api/ships/used/${listing.id}/buy/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json() as PurchasedShipResponse;
            setShips(prev => prev.filter(ship => ship.id !== listing.id));
            setBalance(prev => prev !== null ? prev - listing.price : prev);
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            showToast(`${listing.name} gekauft!`);

            const port = (window.__latestPorts ?? []).find(p => p.id === data.currentPortId);
            if (port) {
                const currentUser = localStorage.getItem("crowns_user");
                const parsedUser = currentUser ? JSON.parse(currentUser) : {};
                const playerName = parsedUser.username ?? parsedUser.name ?? "Spieler";
                const syntheticShip = {
                    playerShipId: data.id,
                    playerId: data.playerId ?? playerId,
                    playerName,
                    iconUrl: data.iconUrl ?? listing.iconUrl ?? "/ship.png",
                    x: port.x,
                    y: port.y,
                    status: "AT_PORT" as const,
                    arrivalTick: null,
                    originX: null,
                    originY: null,
                    destX: null,
                    destY: null,
                    startTick: null,
                };
                const updated = [
                    ...(window.__latestShips ?? []).filter(ship => ship.playerShipId !== data.id),
                    syntheticShip,
                ];
                window.__latestShips = updated;
                const currentTick = window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
                window.dispatchEvent(new CustomEvent("backend-ship-positions", {
                    detail: { currentTick, ships: updated },
                }));
            }
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
                <div className="shipclass-title-main">Gebrauchte Schiffe</div>
                <div className="shipclass-title-sub">Schiffe anderer Kapitäne mit echtem Zustand</div>
                <div className="shipclass-ornament">
                    <div className="shipclass-orn-line" />
                    <div className="shipclass-orn-diamond" />
                    <div className="shipclass-orn-line" />
                </div>
            </div>

            {loading && <p className="shipclass-status">Lade Schiffe...</p>}
            {error && <p className="shipclass-status">{error}</p>}
            {!loading && !error && ships.length === 0 && (
                <p className="shipclass-status">Keine gebrauchten Schiffe verfügbar.</p>
            )}

            <div className="ship-grid-wrapper">
                <div className="ship-grid">
                    {ships.map(ship => {
                        const canAfford = balance !== null && balance >= ship.price;
                        return (
                            <div key={ship.id} className="ship-listing-card">
                                <div className="ship-listing-img-wrap">
                                    <img src={ship.iconUrl} alt={ship.name} className="ship-listing-img" />
                                </div>

                                <div className="ship-listing-info">
                                    <div className="ship-listing-name">{ship.name}</div>
                                    <div className="ship-listing-desc">{ship.description}</div>
                                    <div className="ship-listing-stats">
                                        <StatRow label="Klasse" value={formatShipClass(ship.shipClass)} />
                                        <StatRow label="Tank" value={`${Math.round(ship.fuel)}%`} />
                                        <StatRow label="Zustand" value={`${Math.round(ship.condition)}%`} />
                                        <StatRow label="Kapazität" value={`${ship.maxCargoCapacity} t`} />
                                        <StatRow label="Geschw." value={`${ship.maxSpeed} kn`} />
                                        <StatRow label="Verbrauch" value={`${ship.fuelConsumption} t/d`} />
                                    </div>

                                    <div className="ship-listing-footer">
                                        <span className="ship-listing-price">{formatMoney(ship.price)} T</span>
                                        <GameButton
                                            onClick={() => handleBuy(ship)}
                                            disabled={!canAfford || buyingId === ship.id}
                                        >
                                            {buyingId === ship.id ? "..." : !canAfford ? "Zu teuer" : "Kaufen"}
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

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="stat-row">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
        </div>
    );
}

function formatMoney(value: number) {
    return Number(value).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function formatShipClass(shipClass: string) {
    const labels: Record<string, string> = {
        BUDGET: "Einsteiger-Klasse",
        STANDARD: "Standard-Klasse",
        PREMIUM: "Premium-Klasse",
    };
    return labels[shipClass.toUpperCase()] ?? shipClass;
}
