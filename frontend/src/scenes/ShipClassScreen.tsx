import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import GameButton from "../components/GameButton";
import "../style/harbor.css";
import "../style/shipbroker.css";
import "../style/shipclass.css"
import backIcon from "../assets/goback.png";

interface PurchasedShipResponse {
    id: string;
    playerId: string;
    iconUrl: string;
    currentPortId: string;
    status: string;
}

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
    stock: number;
    availableStock: number;
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
    // Wenn der Spieler ein Schiff kauft, triggern wir einen Reload damit sich availableStock aktualisiert.
    const [reloadKey, setReloadKey] = useState(0);

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
    }, [playerId, reloadKey]);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // sessionId mitsenden, damit das Backend availableStock fuer die aktuelle Session berechnet.
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        const url = sessionId
            ? `/api/ships?shipClass=${shipClass}&sessionId=${sessionId}`
            : `/api/ships?shipClass=${shipClass}`;

        fetch(url, {
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
    }, [shipClass, reloadKey]);

    // Live-Updates des Schiffsmarktes — wenn ein anderer Spieler kauft, aktualisiert sich der Stock automatisch.
    useEffect(() => {
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        if (!sessionId) return;

        const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: Record<string, string> = {};
        const token = localStorage.getItem('auth_token');
        if (token) headers["Authorization"] = `Bearer ${token}`;

        client.connect(headers, () => {
            client.subscribe(`/topic/session/${sessionId}/ships`, (msg) => {
                const event = JSON.parse(msg.body) as { ships: Ship[] };
                const allShips = event.ships ?? [];
                // Nur die Schiffe der aktuell angezeigten Klasse uebernehmen
                const filtered = allShips.filter(s => s.shipClass.toUpperCase() === shipClass);
                setShips(filtered);
            });
        }, () => {});

        return () => { if (client.connected) client.disconnect(() => {}); };
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

            const data = await res.json() as PurchasedShipResponse;

            setBoughtIds(prev => new Set(prev).add(ship.id));
            setBalance(prev => prev !== null ? prev - ship.price : null);
            window.dispatchEvent(new CustomEvent('player-balance-updated'));
            showToast(`${ship.name} gekauft!`);
            // Reload triggern, damit availableStock fuer alle Schiffe aktualisiert wird
            // (auch fuer andere Spieler-Kaeufe waeren ein WebSocket-Push praeziser, aber Reload reicht hier).
            setReloadKey(k => k + 1);

            // Sofort die Schiffsposition am Heimathafen anzeigen — kein Warten auf WebSocket-Tick.
            // Funktioniert auch für zukünftige Heimathäfen: einfach currentPortId aus dem Response nutzen.
            const homePort = (window.__latestPorts ?? []).find(p => p.id === data.currentPortId);
            if (homePort) {
                const userData = localStorage.getItem('crowns_user');
                const playerName = userData ? (JSON.parse(userData).username ?? JSON.parse(userData).name ?? 'Spieler') : 'Spieler';
                const syntheticShip = {
                    playerShipId: data.id,
                    playerId: data.playerId ?? playerId,
                    playerName,
                    iconUrl: data.iconUrl ?? '/ship.png',
                    x: homePort.x,
                    y: homePort.y,
                    status: 'AT_PORT' as const,
                    arrivalTick: null, originX: null, originY: null,
                    destX: null, destY: null, startTick: null,
                };
                const updated = [
                    ...(window.__latestShips ?? []).filter(s => s.playerShipId !== data.id),
                    syntheticShip,
                ];
                window.__latestShips = updated;
                const currentTick = window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
                window.__latestShipPositionsTick = currentTick;
                window.dispatchEvent(new CustomEvent('backend-ship-positions', {
                    detail: { currentTick, ships: updated }
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

            {loading && <p className="shipclass-status">Lade Schiffe…</p>}
            {error && <p className="shipclass-status">{error}</p>}

            {!loading && !error && ships.length === 0 && (
                <p className="shipclass-status">Keine Schiffe verfügbar.</p>
            )}

            <div className="ship-grid-wrapper">
                <div className="ship-grid">
                    {ships.map(ship => {
                        const canAfford = balance !== null ? balance >= ship.price : false;
                        const bought = boughtIds.has(ship.id);
                        const outOfStock = ship.availableStock <= 0;
                        const lowStock = !outOfStock && ship.availableStock <= 3;

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
                                    <div className="ship-listing-name">
                                        {ship.name}
                                        <span
                                            className={`ship-stock-badge ${outOfStock ? "out" : lowStock ? "low" : "ok"}`}
                                            title={`${ship.availableStock} von ${ship.stock} in dieser Session noch verfügbar`}
                                        >
                                            {outOfStock
                                                ? "Ausverkauft"
                                                : `${ship.availableStock} / ${ship.stock} verfügbar`}
                                        </span>
                                    </div>
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
                                            disabled={!canAfford || bought || buyingId === ship.id || outOfStock}
                                        >
                                            {bought
                                                ? "Gekauft"
                                                : buyingId === ship.id
                                                    ? "..."
                                                    : outOfStock
                                                        ? "Ausverkauft"
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
        BUDGET: "Einsteiger-Klasse",
        STANDARD: "Standard-Klasse",
        PREMIUM: "Premium-Klasse",
    };

    return map[shipClass] ?? shipClass;
}
