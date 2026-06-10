import { useEffect, useState, useCallback } from "react";
import GameButton from "../components/GameButton";
import "../style/harbor.css";
import "../style/shipbroker.css";
import "../style/shipclass.css";
import audioEngine from "../audio/AudioEngine";
import BackButton from "../components/BackButton.tsx";

interface PurchasedShipResponse {
    id: string;
    playerId: string;
    iconUrl: string;
    currentPortId: string;
    status: string;
}

interface ShipDeal {
    dealId: string;
    shipId: string;
    name: string;
    description: string;
    shipClass: string;
    iconUrl: string;
    maxCargoCapacity: number;
    maxSpeed: number;
    fuelConsumption: number;
    maxFuel: number;
    operatingCost: number;
    baseReliability: number;
    originalPrice: number;
    dealPrice: number;
    discountPercent: number;
    remainingQuantity: number;
    expiresInTicks: number;
    traderBonus: boolean;
}

interface Props {
    onBack: () => void;
}

const POLL_INTERVAL_MS = 5000;

export default function ShipDealsScreen({ onBack }: Props) {
    const [deals, setDeals] = useState<ShipDeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;

    const getSessionId = useCallback((): string | null => {
        const sessionData = sessionStorage.getItem("currentSession");
        return sessionData ? JSON.parse(sessionData).id : null;
    }, []);

    const loadBalance = useCallback(() => {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) return;
        fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        })
            .then((res) => res.json())
            .then((data: number) => setBalance(Number(data)))
            .catch(() => setBalance(null));
    }, [getSessionId, playerId]);

    const loadDeals = useCallback(
        (showSpinner: boolean) => {
            const sessionId = getSessionId();
            if (!sessionId || !playerId) {
                setError("Session nicht gefunden.");
                setLoading(false);
                return;
            }
            if (showSpinner) setLoading(true);

            fetch(`/api/ships/deals/${playerId}?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Fehler beim Laden");
                    return res.json();
                })
                .then((data: ShipDeal[]) => {
                    setDeals(data);
                    setError(null);
                    setLoading(false);
                })
                .catch(() => {
                    setError("Angebote konnten nicht geladen werden.");
                    setLoading(false);
                });
        },
        [getSessionId, playerId]
    );

    useEffect(() => {
        loadBalance();
        loadDeals(true);
        const interval = setInterval(() => {
            loadDeals(false);
            loadBalance();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [loadBalance, loadDeals]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }

    async function handleBuy(deal: ShipDeal) {
        setBuyingId(deal.dealId);
        const sessionId = getSessionId();
        if (!sessionId || !playerId) {
            showToast("Session nicht gefunden.");
            setBuyingId(null);
            return;
        }

        try {
            const res = await fetch(
                `/api/ships/deals/${deal.dealId}/buy/${playerId}?sessionId=${sessionId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
                    },
                }
            );

            if (!res.ok) throw new Error();

            const data = (await res.json()) as PurchasedShipResponse;

            setBalance((prev) => (prev !== null ? prev - deal.dealPrice : null));
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            audioEngine.playSfx("coinReward");
            showToast(`${deal.name} zum Angebotspreis gekauft!`);

            // Schiff sofort am Heimathafen anzeigen, ohne auf den naechsten Tick zu warten.
            const homePort = (window.__latestPorts ?? []).find((p) => p.id === data.currentPortId);
            if (homePort) {
                const playerName = userData
                    ? JSON.parse(userData).username ?? JSON.parse(userData).name ?? "Spieler"
                    : "Spieler";
                const syntheticShip = {
                    playerShipId: data.id,
                    playerId: data.playerId ?? playerId,
                    playerName,
                    iconUrl: data.iconUrl ?? "/ship.png",
                    x: homePort.x,
                    y: homePort.y,
                    status: "AT_PORT" as const,
                    arrivalTick: null,
                    originX: null,
                    originY: null,
                    destX: null,
                    destY: null,
                    startTick: null,
                };
                const updated = [
                    ...(window.__latestShips ?? []).filter((s) => s.playerShipId !== data.id),
                    syntheticShip,
                ];
                window.__latestShips = updated;
                const currentTick =
                    window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
                window.__latestShipPositionsTick = currentTick;
                window.dispatchEvent(
                    new CustomEvent("backend-ship-positions", {
                        detail: { currentTick, ships: updated },
                    })
                );
            }

            loadDeals(false);
        } catch {
            showToast("Angebot nicht mehr verfügbar.");
            loadDeals(false);
        } finally {
            setBuyingId(null);
        }
    }

    return (
        <div className="shipclass-scene">
            <BackButton onClick={onBack} />

            <div className="shipclass-title-area">
                <div className="shipclass-title-main">Schiffsangebote</div>
                <div className="shipclass-title-sub">Zeitlich begrenzt · Schnell sein lohnt sich</div>

                <div className="shipclass-ornament">
                    <div className="shipclass-orn-line" />
                    <div className="shipclass-orn-diamond" />
                    <div className="shipclass-orn-line" />
                </div>
            </div>

            {loading && <p className="shipclass-status">Lade Angebote…</p>}
            {error && <p className="shipclass-status">{error}</p>}

            {!loading && !error && deals.length === 0 && (
                <p className="shipclass-status">Aktuell keine Angebote verfügbar.</p>
            )}

            <div className="ship-grid-wrapper">
                <div className="ship-grid">
                    {deals.map((deal) => {
                        const canAfford = balance !== null ? balance >= deal.dealPrice : false;
                        const soldOut = deal.remainingQuantity <= 0;
                        const expiringSoon = deal.expiresInTicks <= 3;

                        return (
                            <div key={deal.dealId} className="ship-listing-card ship-deal-card">
                                <div className={`ship-deal-timer ${expiringSoon ? "urgent" : ""}`}>
                                    {deal.expiresInTicks > 0
                                        ? `${deal.expiresInTicks} Ticks`
                                        : "Läuft ab"}
                                </div>

                                <div className="ship-listing-img-wrap">
                                    <img
                                        src={deal.iconUrl}
                                        alt={deal.name}
                                        className="ship-listing-img"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/fallback-ship.png";
                                        }}
                                    />
                                </div>

                                <div className="ship-listing-info">
                                    <div className="ship-listing-name">
                                        {deal.name}
                                        <span
                                            className={`ship-stock-badge ${soldOut ? "out" : "low"}`}
                                            title={`Noch ${deal.remainingQuantity} zu diesem Preis`}
                                        >
                                            {soldOut ? "Vergriffen" : `nur ${deal.remainingQuantity} verfügbar`}
                                        </span>
                                    </div>
                                    <div className="ship-listing-desc">{deal.description}</div>

                                    <div className="ship-listing-stats">
                                        <StatRow label="Geschwindigkeit" value={`${deal.maxSpeed} kn`} />
                                        <StatRow label="Kapazität" value={`${deal.maxCargoCapacity} t`} />
                                        <StatRow label="Tank" value={`${deal.maxFuel} t`} />
                                        <StatRow label="Verbrauch" value={`${deal.fuelConsumption} t/d`} />
                                        <StatRow label="Betriebskosten" value={`${deal.operatingCost}`} />
                                        <StatRow
                                            label="Zuverlässigkeit"
                                            value={`${Math.round(deal.baseReliability * 100)}%`}
                                        />
                                    </div>

                                    <div className="ship-listing-footer">
                                        <div className="ship-deal-tags">
                                            <span className="ship-deal-badge">−{deal.discountPercent}%</span>
                                            {deal.traderBonus && (
                                                <span className="ship-deal-badge trader">Händler-Vorteil</span>
                                            )}
                                        </div>

                                        <div className="ship-deal-pricing">
                                            <span className="ship-listing-price original">
                                                {deal.originalPrice.toLocaleString("de")}
                                            </span>
                                            <span className="ship-deal-price">
                                                {deal.dealPrice.toLocaleString("de")}
                                            </span>
                                        </div>

                                        <GameButton
                                            onClick={() => handleBuy(deal)}
                                            disabled={!canAfford || soldOut || buyingId === deal.dealId}
                                        >
                                            {buyingId === deal.dealId
                                                ? "..."
                                                : soldOut
                                                    ? "Vergriffen"
                                                    : !canAfford
                                                        ? "Zu teuer"
                                                        : "Zum Angebot kaufen"}
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