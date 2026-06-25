import { useEffect, useState, useCallback, useMemo } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import audioEngine from "../audio/AudioEngine";
import BackButton from "../components/BackButton.tsx";
import "../style/shipmarket.css";

interface PurchasedShipResponse {
    id: string;
    playerId: string;
    iconUrl: string;
    currentPortId: string;
    status: string;
}

interface MarketShip {
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

type Tab = "BUDGET" | "STANDARD" | "PREMIUM" | "USED" | "DEALS";

interface Props {
    onClose: () => void;
}

const TABS: { id: Tab; label: string }[] = [
    { id: "BUDGET", label: "Budget" },
    { id: "STANDARD", label: "Standard" },
    { id: "PREMIUM", label: "Premium" },
    { id: "USED", label: "Gebraucht" },
    { id: "DEALS", label: "Angebote" },
];

const DEAL_POLL_MS = 5000;

export default function ShipBrokerScene({ onClose }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("BUDGET");

    const [ships, setShips] = useState<MarketShip[]>([]);
    const [deals, setDeals] = useState<ShipDeal[]>([]);
    const [usedShips, setUsedShips] = useState<UsedShipListing[]>([]);
    const [balance, setBalance] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    const getSessionId = useCallback((): string | null => {
        const sessionData = sessionStorage.getItem("currentSession");
        return sessionData ? JSON.parse(sessionData).id : null;
    }, []);

    const loadBalance = useCallback(() => {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) return;
        fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setBalance(Number(data)))
            .catch(() => setBalance(null));
    }, [getSessionId, playerId, token]);

    const loadDeals = useCallback(() => {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) return;
        fetch(`/api/ships/deals/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => (res.ok ? res.json() : []))
            .then((data: ShipDeal[]) => setDeals(data ?? []))
            .catch(() => { /* Angebote sind optional, Markt bleibt nutzbar */ });
    }, [getSessionId, playerId, token]);

    const loadUsedShips = useCallback(() => {
        const sessionId = getSessionId();
        if (!sessionId) return;
        fetch(`/api/ships/used?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => (res.ok ? res.json() : []))
            .then((data: UsedShipListing[]) => setUsedShips(data ?? []))
            .catch(() => { /* leerer Gebraucht-Markt ist ok */ });
    }, [getSessionId, token]);


    const loadShips = useCallback((withSpinner: boolean) => {
        const sessionId = getSessionId();
        if (!sessionId) return;
        if (withSpinner) setLoading(true);
        fetch(`/api/ships?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error("Fehler beim Laden");
                return res.json();
            })
            .then((data: MarketShip[]) => { setShips(data ?? []); setError(null); })
            .catch(() => setError("Schiffe konnten nicht geladen werden."))
            .finally(() => { if (withSpinner) setLoading(false); });
    }, [getSessionId, token]);

    useEffect(() => {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) {
            setError("Session nicht gefunden.");
            setLoading(false);
            return;
        }
        loadShips(true);
        loadBalance();
        loadDeals();
        loadUsedShips();
    }, [getSessionId, playerId, loadShips, loadBalance, loadDeals, loadUsedShips]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadDeals();
            loadBalance();
        }, DEAL_POLL_MS);
        return () => clearInterval(interval);
    }, [loadDeals, loadBalance]);

    useEffect(() => {
        const sessionId = getSessionId();
        if (!sessionId) return;

        const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        client.connect(headers, () => {
            client.subscribe(`/topic/session/${sessionId}/ships`, (msg) => {
                try {
                    const event = JSON.parse(msg.body);
                    const incoming = Array.isArray(event?.ships) ? event.ships : [];
                    const isMarketUpdate =
                        incoming.length > 0 &&
                        incoming.every((s: { shipClass?: unknown }) => typeof s?.shipClass === "string");
                    if (isMarketUpdate) setShips(incoming as MarketShip[]);
                } catch {
                    /* fehlerhafte Nachricht ignorieren */
                }
            });
        }, () => {});

        return () => { if (client.connected) client.disconnect(() => {}); };
    }, [getSessionId, token]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }

    const dealByShipId = useMemo(() => {
        const map = new Map<string, ShipDeal>();
        deals.forEach(d => {
            if (d.remainingQuantity > 0) map.set(d.shipId, d);
        });
        return map;
    }, [deals]);

    function placeShipAtHome(data: PurchasedShipResponse, fallbackIcon: string) {
        const homePort = (window.__latestPorts ?? []).find(p => p.id === data.currentPortId);
        if (!homePort) return;
        const playerName = userData
            ? JSON.parse(userData).username ?? JSON.parse(userData).name ?? "Spieler"
            : "Spieler";
        const syntheticShip = {
            playerShipId: data.id,
            playerId: data.playerId ?? playerId,
            playerName,
            iconUrl: data.iconUrl ?? fallbackIcon ?? "/ship.png",
            x: homePort.x,
            y: homePort.y,
            status: "AT_PORT" as const,
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
        window.dispatchEvent(new CustomEvent("backend-ship-positions", {
            detail: { currentTick, ships: updated },
        }));
    }

    async function postBuy(url: string, body?: unknown): Promise<PurchasedShipResponse> {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        if (!res.ok) throw new Error();
        return (await res.json()) as PurchasedShipResponse;
    }

    async function handleBuyShip(ship: MarketShip) {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) { showToast("Session nicht gefunden."); return; }

        const deal = dealByShipId.get(ship.id);
        setBuyingId(ship.id);
        try {
            const data = deal
                ? await postBuy(`/api/ships/deals/${deal.dealId}/buy/${playerId}?sessionId=${sessionId}`)
                : await postBuy(`/api/ships/buy/${playerId}?sessionId=${sessionId}`, { shipId: ship.id });

            const price = deal ? deal.dealPrice : ship.price;
            afterBuy(data, price, ship.iconUrl, ship.name, deal ? "zum Angebotspreis " : "");
            loadShips(false);       // availableStock sofort aktualisieren
            if (deal) loadDeals();
        } catch {
            showToast(deal ? "Angebot nicht mehr verfügbar." : "Kauf fehlgeschlagen.");
            if (deal) loadDeals();
        } finally {
            setBuyingId(null);
        }
    }

    async function handleBuyDeal(deal: ShipDeal) {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) { showToast("Session nicht gefunden."); return; }
        setBuyingId(deal.dealId);
        try {
            const data = await postBuy(`/api/ships/deals/${deal.dealId}/buy/${playerId}?sessionId=${sessionId}`);
            afterBuy(data, deal.dealPrice, deal.iconUrl, deal.name, "zum Angebotspreis ");
            loadDeals();
        } catch {
            showToast("Angebot nicht mehr verfügbar.");
            loadDeals();
        } finally {
            setBuyingId(null);
        }
    }

    async function handleBuyUsed(listing: UsedShipListing) {
        const sessionId = getSessionId();
        if (!sessionId || !playerId) { showToast("Session nicht gefunden."); return; }
        setBuyingId(listing.id);
        try {
            const data = await postBuy(`/api/ships/used/${listing.id}/buy/${playerId}?sessionId=${sessionId}`);
            setUsedShips(prev => prev.filter(s => s.id !== listing.id));
            afterBuy(data, listing.price, listing.iconUrl, listing.name, "");
        } catch {
            showToast("Kauf fehlgeschlagen.");
        } finally {
            setBuyingId(null);
        }
    }

    function afterBuy(
        data: PurchasedShipResponse,
        price: number,
        fallbackIcon: string,
        shipName: string,
        priceNote: string,
    ) {
        setBalance(prev => (prev !== null ? prev - price : prev));
        window.dispatchEvent(new CustomEvent("player-balance-updated"));
        audioEngine.playSfx("coinReward");
        showToast(`${shipName} ${priceNote}gekauft!`.replace("  ", " "));
        placeShipAtHome(data, fallbackIcon);
    }

    function changeTab(tab: Tab) {
        if (tab === activeTab) return;
        audioEngine.playSfx("buttonClick");
        setActiveTab(tab);
    }

    const classShips = ships
        .filter(s => (s.shipClass ?? "").toUpperCase() === activeTab)
        .sort((a, b) => a.price - b.price);

    const hasActiveDeals = dealByShipId.size > 0;

    return (
        <div className="sm-screen">
            <BackButton onClick={onClose} tutorialTarget="close-ship-market" />

            <h1 className="sm-title">Schiffsmarkt</h1>

            <div className="sm-panel">
                <div className="sm-tabs">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`sm-tab${activeTab === t.id ? " sm-tab--active" : ""}`}
                            onClick={() => changeTab(t.id)}
                        >
                            {t.label}
                            {t.id === "DEALS" && hasActiveDeals && <span className="sm-tab-dot" />}
                        </button>
                    ))}
                </div>

                {loading && <p className="sm-status">Lade Schiffsmarkt…</p>}
                {error && <p className="sm-status">{error}</p>}

                {!loading && !error && (
                    <div className="sm-grid-scroll">
                        {(activeTab === "BUDGET" || activeTab === "STANDARD" || activeTab === "PREMIUM") && (
                            classShips.length === 0 ? (
                                <p className="sm-status">Keine Schiffe in dieser Klasse verfügbar.</p>
                            ) : (
                                <div className="sm-grid">
                                    {classShips.map(ship => (
                                        <ClassShipCard
                                            key={ship.id}
                                            ship={ship}
                                            deal={dealByShipId.get(ship.id)}
                                            balance={balance}
                                            buying={buyingId === ship.id}
                                            onBuy={() => handleBuyShip(ship)}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === "USED" && (
                            usedShips.length === 0 ? (
                                <p className="sm-status">Keine gebrauchten Schiffe verfügbar.</p>
                            ) : (
                                <div className="sm-grid">
                                    {usedShips.map(listing => (
                                        <UsedShipCard
                                            key={listing.id}
                                            listing={listing}
                                            balance={balance}
                                            buying={buyingId === listing.id}
                                            onBuy={() => handleBuyUsed(listing)}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === "DEALS" && (
                            deals.length === 0 ? (
                                <p className="sm-status">Aktuell keine Angebote verfügbar.</p>
                            ) : (
                                <div className="sm-grid">
                                    {deals.map(deal => (
                                        <DealCard
                                            key={deal.dealId}
                                            deal={deal}
                                            balance={balance}
                                            buying={buyingId === deal.dealId}
                                            onBuy={() => handleBuyDeal(deal)}
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {toast && <div className="sm-toast">{toast}</div>}
        </div>
    );
}

function ClassShipCard({
                           ship, deal, balance, buying, onBuy,
                       }: {
    ship: MarketShip;
    deal?: ShipDeal;
    balance: number | null;
    buying: boolean;
    onBuy: () => void;
}) {
    const price = deal ? deal.dealPrice : ship.price;
    const canAfford = balance !== null && balance >= price;
    const outOfStock = !deal && ship.availableStock <= 0;
    const lowStock = !outOfStock && ship.availableStock <= 3;

    return (
        <div className={`sm-card${deal ? " sm-card--deal" : ""}`}>
            <span className="sm-pin" />
            <div className="sm-card-img-wrap">
                {deal && <div className="sm-deal-ribbon">−{deal.discountPercent}% Angebot</div>}
                <img
                    src={ship.iconUrl}
                    alt={ship.name}
                    className="sm-card-img"
                    onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                />
            </div>

            <div className="sm-card-body">
                <div className="sm-card-head">
                    <span className="sm-card-name">{ship.name}</span>
                    <span
                        className={`sm-stock-badge ${outOfStock ? "out" : lowStock ? "low" : "ok"}`}
                        title={`${ship.availableStock} von ${ship.stock} in dieser Session verfügbar`}
                    >
                        {outOfStock ? "Ausverkauft" : `${ship.availableStock} / ${ship.stock}`}
                    </span>
                </div>

                {deal?.traderBonus && <div className="sm-trader-banner">Händler-Vorteil</div>}

                <p className="sm-card-desc">{ship.description}</p>

                <ShipStats
                    speed={ship.maxSpeed}
                    capacity={ship.maxCargoCapacity}
                    fuel={ship.maxFuel}
                    consumption={ship.fuelConsumption}
                    operatingCost={ship.operatingCost}
                    reliability={ship.baseReliability}
                />

                <div className="sm-card-footer">
                    <div className="sm-price-row">
                        {deal ? (
                            <>
                                <span className="sm-price sm-price--original">{fmt(deal.originalPrice)}</span>
                                <span className="sm-price--deal">{fmt(deal.dealPrice)}</span>
                            </>
                        ) : (
                            <span className="sm-price">{fmt(ship.price)}</span>
                        )}
                    </div>

                    <button
                        className="sm-buy-btn"
                        onClick={onBuy}
                        disabled={!canAfford || buying || outOfStock}
                        data-tutorial="buy-ship"
                    >
                        {buying ? "…"
                            : outOfStock ? "Ausverkauft"
                                : !canAfford ? "Zu teuer"
                                    : deal ? "Zum Angebot kaufen"
                                        : "Kaufen"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UsedShipCard({
                          listing, balance, buying, onBuy,
                      }: {
    listing: UsedShipListing;
    balance: number | null;
    buying: boolean;
    onBuy: () => void;
}) {
    const canAfford = balance !== null && balance >= listing.price;

    return (
        <div className="sm-card">
            <span className="sm-pin" />
            <div className="sm-card-img-wrap">
                <img
                    src={listing.iconUrl}
                    alt={listing.name}
                    className="sm-card-img"
                    onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                />
            </div>

            <div className="sm-card-body">
                <div className="sm-card-head">
                    <span className="sm-card-name">{listing.name}</span>
                    <span className="sm-stock-badge ok">{formatShipClass(listing.shipClass)}</span>
                </div>

                <p className="sm-card-desc">{listing.description}</p>

                <div className="sm-stats">
                    <Stat label="Tank" value={`${Math.round(listing.fuel)}%`} />
                    <Stat label="Zustand" value={`${Math.round(listing.condition)}%`} />
                    <Stat label="Kapazität" value={`${listing.maxCargoCapacity} t`} />
                    <Stat label="Geschw." value={`${listing.maxSpeed} kn`} />
                    <Stat label="Verbrauch" value={`${listing.fuelConsumption} t/d`} />
                    <Stat label="Betriebsk." value={`${listing.operatingCost}`} />
                </div>

                <div className="sm-card-footer">
                    <div className="sm-price-row">
                        <span className="sm-price">{fmt(listing.price)}</span>
                    </div>
                    <button
                        className="sm-buy-btn"
                        onClick={onBuy}
                        disabled={!canAfford || buying}
                    >
                        {buying ? "…" : !canAfford ? "Zu teuer" : "Kaufen"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DealCard({
                      deal, balance, buying, onBuy,
                  }: {
    deal: ShipDeal;
    balance: number | null;
    buying: boolean;
    onBuy: () => void;
}) {
    const canAfford = balance !== null && balance >= deal.dealPrice;
    const soldOut = deal.remainingQuantity <= 0;
    const expiringSoon = deal.expiresInTicks <= 3;

    return (
        <div className="sm-card sm-card--deal">
            <span className="sm-pin" />
            <div className="sm-card-img-wrap">
                <div className="sm-deal-ribbon">−{deal.discountPercent}%</div>
                <div className={`sm-deal-timer${expiringSoon ? " sm-deal-timer--urgent" : ""}`}>
                    {deal.expiresInTicks > 0 ? `${deal.expiresInTicks} Ticks` : "Läuft ab"}
                </div>
                <img
                    src={deal.iconUrl}
                    alt={deal.name}
                    className="sm-card-img"
                    onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                />
            </div>

            <div className="sm-card-body">
                <div className="sm-card-head">
                    <span className="sm-card-name">{deal.name}</span>
                    <span className={`sm-stock-badge ${soldOut ? "out" : "low"}`}>
                        {soldOut ? "Vergriffen" : `nur ${deal.remainingQuantity}`}
                    </span>
                </div>

                {deal.traderBonus && <div className="sm-trader-banner">Händler-Vorteil</div>}

                <p className="sm-card-desc">{deal.description}</p>

                <ShipStats
                    speed={deal.maxSpeed}
                    capacity={deal.maxCargoCapacity}
                    fuel={deal.maxFuel}
                    consumption={deal.fuelConsumption}
                    operatingCost={deal.operatingCost}
                    reliability={deal.baseReliability}
                />

                <div className="sm-card-footer">
                    <div className="sm-price-row">
                        <span className="sm-price sm-price--original">{fmt(deal.originalPrice)}</span>
                        <span className="sm-price--deal">{fmt(deal.dealPrice)}</span>
                    </div>
                    <button
                        className="sm-buy-btn"
                        onClick={onBuy}
                        disabled={!canAfford || soldOut || buying}
                    >
                        {buying ? "…" : soldOut ? "Vergriffen" : !canAfford ? "Zu teuer" : "Zum Angebot kaufen"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ShipStats({
                       speed, capacity, fuel, consumption, operatingCost, reliability,
                   }: {
    speed: number;
    capacity: number;
    fuel: number;
    consumption: number;
    operatingCost: number;
    reliability: number;
}) {
    return (
        <div className="sm-stats">
            <Stat label="Geschw." value={`${speed} kn`} />
            <Stat label="Kapazität" value={`${capacity} t`} />
            <Stat label="Tank" value={`${fuel} t`} />
            <Stat label="Verbrauch" value={`${consumption} t/d`} />
            <Stat label="Betriebsk." value={`${operatingCost}`} />
            <Stat label="Zuverlässigkeit" value={`${Math.round(reliability * 100)}%`} />
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="sm-stat">
            <span className="sm-stat-label">{label}</span>
            <span className="sm-stat-value">{value}</span>
        </div>
    );
}

function fmt(value: number) {
    return `${Number(value).toLocaleString("de-DE", { maximumFractionDigits: 0 })} T`;
}

function formatShipClass(shipClass: string) {
    const labels: Record<string, string> = {
        BUDGET: "Budget",
        STANDARD: "Standard",
        PREMIUM: "Premium",
    };
    return labels[shipClass.toUpperCase()] ?? shipClass;
}
