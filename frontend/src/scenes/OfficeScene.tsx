import { useEffect, useMemo, useState } from "react";
import GameButton from "../components/GameButton";
import officeBackground from "../assets/office-background.png";
import "../style/shipclass.css";
import "../style/office.css";
import audioEngine from '../audio/AudioEngine';
import BackButton from "../components/BackButton";

interface PlayerShip {
    id: string;
    shipId: string;
    name: string;
    description: string;
    shipClass: string;
    status: string;
    fuel: number;
    condition: number;
    currentPortId?: string;
    maxFuel: number;
    maxCargoCapacity: number;
    maxSpeed: number;
    fuelConsumption: number;
    operatingCost: number;
    baseReliability: number;
    iconUrl: string;
    completionTick?: number | null;
}

interface SellQuote {
    playerShipId: string;
    shipName: string;
    originalPrice: number;
    baseSellPrice: number;
    condition: number;
    fuel: number;
    conditionWeight: number;
    fuelWeight: number;
    finalPrice: number;
}

interface Props {
    onClose: () => void;
}

const FUEL_PRICE_PER_UNIT = 3.0;
const REPAIR_PRICE_FACTOR = 50.0;

export default function OfficeScene({ onClose }: Props) {
    const [ships, setShips] = useState<PlayerShip[]>([]);
    const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [sellQuote, setSellQuote] = useState<SellQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState<"refuel" | "repair" | "sell" | null>(null);
    const [showSellConfirm, setShowSellConfirm] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    const selectedShip = useMemo(
        () => ships.find(ship => ship.id === selectedShipId) ?? null,
        [ships, selectedShipId],
    );

    const canUseActions = selectedShip?.status === "AT_PORT";
    const fuelNeededPercent = selectedShip ? Math.max(0, 100 - selectedShip.fuel) : 0;
    const fuelCost = selectedShip
        ? roundMoney((fuelNeededPercent / 100) * Number(selectedShip.maxFuel) * FUEL_PRICE_PER_UNIT)
        : 0;
    const repairNeededPercent = selectedShip ? Math.max(0, 100 - selectedShip.condition) : 0;
    const repairCost = selectedShip
        ? roundMoney((repairNeededPercent / 100) * Number(selectedShip.operatingCost) * REPAIR_PRICE_FACTOR)
        : 0;
    const canAffordFuel = balance !== null && balance >= fuelCost;
    const canAffordRepair = balance !== null && balance >= repairCost;
    const alreadyFull = fuelNeededPercent < 0.01;
    const alreadyRepaired = repairNeededPercent < 0.01;

    function showError(msg: string) {
        audioEngine.playSfx('error');
        setError(msg);
    }

    useEffect(() => {
        loadOfficeData();
    }, [playerId, sessionId, token]);

    useEffect(() => {
        function handleShipPositions(e: Event) {
            const detail = (e as CustomEvent).detail;
            const wsShips: any[] = detail.ships ?? [];

            setShips(prev => prev.map(ship => {
                const wsShip = wsShips.find((ws: any) => ws.playerShipId === ship.id);
                if (!wsShip) return ship;

                const newStatus = wsShip.status ?? ship.status;
                const updates: Partial<PlayerShip> = { status: newStatus, completionTick: wsShip.arrivalTick };

                if (ship.status === "REFUELING" && newStatus === "AT_PORT") {
                    loadOfficeData();
                } else if (ship.status === "REPAIRING" && newStatus === "AT_PORT") {
                    loadOfficeData();
                }

                return { ...ship, ...updates };
            }));
        }

        window.addEventListener("backend-ship-positions", handleShipPositions);
        return () => window.removeEventListener("backend-ship-positions", handleShipPositions);
    }, []);

    useEffect(() => {
        setSellQuote(null);
        if (!selectedShip || !playerId || !sessionId || selectedShip.status !== "AT_PORT") return;

        fetch(`/api/ships/${selectedShip.id}/sell-quote?playerId=${playerId}&sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then((quote: SellQuote | null) => setSellQuote(quote))
            .catch(() => setSellQuote(null));
    }, [selectedShip?.id, selectedShip?.status, selectedShip?.fuel, selectedShip?.condition, playerId, sessionId, token]);

    function loadOfficeData() {
        if (!playerId || !sessionId) return;
        setLoading(true);
        setError(null);
        Promise.all([
            fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            }),
            fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.json()),
        ])
            .then(([shipData, balanceData]: [PlayerShip[], unknown]) => {
                setShips(shipData);
                setBalance(Number(balanceData));
                setSelectedShipId(prev => {
                    if (prev && shipData.some(ship => ship.id === prev)) return prev;
                    return shipData[0]?.id ?? null;
                });
            })
            .catch(() => showError("Büro konnte die Flotte nicht laden."))
            .finally(() => setLoading(false));
    }

    function showToast(message: string) {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }

    function updateShipLocally(id: string, changes: Partial<PlayerShip>) {
        setShips(prev => prev.map(ship => ship.id === id ? { ...ship, ...changes } : ship));
    }

    async function handleRefuel() {
        if (!selectedShip || !playerId || !sessionId || !canUseActions || alreadyFull || !canAffordFuel) return;
        setActionBusy("refuel");
        setError(null);
        try {
            const res = await fetch(`/api/ships/${selectedShip.id}/refuel?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            updateShipLocally(selectedShip.id, {
                status: "REFUELING",
                completionTick: data.refuelingCompletedAtTick,
            });
            setBalance(Number(data.newBalance));
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            showToast(`${selectedShip.name} wird betankt… (${data.refuelingDurationTicks} Ticks)`);
        } catch {
            showError("Betanken fehlgeschlagen.");
        } finally {
            setActionBusy(null);
        }
    }

    async function handleRepair() {
        if (!selectedShip || !playerId || !sessionId || !canUseActions || alreadyRepaired || !canAffordRepair) return;
        setActionBusy("repair");
        setError(null);
        try {
            const res = await fetch(`/api/ships/${selectedShip.id}/repair?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            updateShipLocally(selectedShip.id, {
                status: "REPAIRING",
                completionTick: data.repairingCompletedAtTick,
            });
            setBalance(Number(data.newBalance));
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            showToast(`${selectedShip.name} wird repariert… (${data.repairingDurationTicks} Ticks)`);
        } catch {
            showError("Reparatur fehlgeschlagen.");
        } finally {
            setActionBusy(null);
        }
    }

    async function handleSell() {
        if (!selectedShip || !playerId || !sessionId || !canUseActions) return;
        setActionBusy("sell");
        setError(null);
        try {
            const res = await fetch(`/api/ships/${selectedShip.id}/sell?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setShips(prev => prev.filter(ship => ship.id !== selectedShip.id));
            setSelectedShipId(prev => prev === selectedShip.id ? null : prev);
            setBalance(Number(data.newBalance));
            setShowSellConfirm(false);
            window.__latestShips = (window.__latestShips ?? []).filter(ship => ship.playerShipId !== selectedShip.id);
            const currentTick = window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
            window.dispatchEvent(new CustomEvent("backend-ship-positions", {
                detail: { currentTick, ships: window.__latestShips ?? [] },
            }));
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            audioEngine.playSfx('coinReward');
            showToast(`${selectedShip.name} verkauft.`);
        } catch {
            showError("Verkauf fehlgeschlagen.");
        } finally {
            setActionBusy(null);
        }
    }

    return (
        <div className="shipclass-scene office-scene">
            <img src={officeBackground} className="office-background" alt="" />
            <BackButton onClick={onClose} />

            {loading && <p className="shipclass-status">Lade Büro...</p>}
            {error && <p className="shipclass-status">{error}</p>}

            {!loading && !error && (
                <div className="office-layout">
                    <section className="office-list">
                        <div className="office-list-header">
                            <h2>Meine Flotte</h2>
                        </div>
                        {ships.length === 0 && (
                            <div className="office-empty">Keine Schiffe in deiner Flotte.</div>
                        )}
                        {ships.map(ship => (
                            <button
                                key={ship.id}
                                className={`office-ship-card ${selectedShipId === ship.id ? "selected" : ""}`}
                                onClick={() => setSelectedShipId(ship.id)}
                            >
                                <img src={ship.iconUrl} alt={ship.name} />
                                <div>
                                    <strong>{ship.name}</strong>
                                    <span>{statusLabel(ship.status)} · {ship.shipClass}</span>
                                    <span>Tank {Math.round(ship.fuel)}% · Zustand {Math.round(ship.condition)}%</span>
                                </div>
                            </button>
                        ))}
                    </section>

                    <section className="office-detail">
                        {!selectedShip && (
                            <div className="office-placeholder">Wähle ein Schiff aus.</div>
                        )}

                        {selectedShip && (
                            <>
                                <div className="office-detail-header">
                                    <img src={selectedShip.iconUrl} alt={selectedShip.name} />
                                    <div>
                                        <h2>{selectedShip.name}</h2>
                                        <p>{selectedShip.description}</p>
                                        <div className="office-status-wrap">
                                            <span className={`office-status ${canUseActions ? "ok" : "blocked"}`}>
                                                {statusLabel(selectedShip.status)}
                                            </span>
                                            {(selectedShip.status === "REFUELING" || selectedShip.status === "REPAIRING"
                                                    || selectedShip.status === "LOADING" || selectedShip.status === "UNLOADING")
                                                && selectedShip.completionTick != null && (
                                                    <TickProgressBar
                                                        completionTick={selectedShip.completionTick}
                                                        label={selectedShip.status === "REFUELING" ? "Betanken"
                                                            : selectedShip.status === "REPAIRING" ? "Reparatur"
                                                                : selectedShip.status === "LOADING" ? "Beladen"
                                                                    : "Entladen"}
                                                    />
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <div className="office-stats-grid">
                                    <OfficeStat label="Tank" value={`${Math.round(selectedShip.fuel)}%`} />
                                    <OfficeStat label="Zustand" value={`${Math.round(selectedShip.condition)}%`} />
                                    <OfficeStat label="Kapazität" value={`${selectedShip.maxCargoCapacity} t`} />
                                    <OfficeStat label="Tempo" value={`${selectedShip.maxSpeed} kn`} />
                                    <OfficeStat label="Standort" value={portName(selectedShip.currentPortId)} />
                                    <OfficeStat label="Verbrauch" value={`${selectedShip.fuelConsumption} t/d`} />
                                </div>

                                {!canUseActions && (
                                    <div className="office-action-lock">
                                        Aktionen sind nur für Schiffe im Hafen verfügbar.
                                    </div>
                                )}

                                <div className="office-actions">
                                    <ActionCard
                                        title="Betanken"
                                        info={alreadyFull ? "Tank ist voll" : `Fehlend ${fuelNeededPercent.toFixed(0)}%`}
                                        cost={alreadyFull ? undefined : `${formatMoney(fuelCost)} T`}
                                        disabled={!canUseActions || alreadyFull || !canAffordFuel || actionBusy !== null}
                                        buttonText={actionBusy === "refuel" ? "Läuft..." : "Betanken"}
                                        onClick={handleRefuel}
                                    />
                                    <ActionCard
                                        title="Reparieren"
                                        info={alreadyRepaired ? "Schiff ist heil" : `Schäden ${repairNeededPercent.toFixed(0)}%`}
                                        cost={alreadyRepaired ? undefined : `${formatMoney(repairCost)} T`}
                                        disabled={!canUseActions || alreadyRepaired || !canAffordRepair || actionBusy !== null}
                                        buttonText={actionBusy === "repair" ? "Läuft..." : "Reparieren"}
                                        onClick={handleRepair}
                                    />
                                    <ActionCard
                                        title="Verkaufen"
                                        info={sellQuote ? "Preis berechnet" : "Preis wird geladen"}
                                        cost={sellQuote ? `${formatMoney(sellQuote.finalPrice)} T` : undefined}
                                        disabled={!canUseActions || !sellQuote || actionBusy !== null}
                                        buttonText="Verkaufen"
                                        onClick={() => setShowSellConfirm(true)}
                                    />
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}

            {showSellConfirm && selectedShip && sellQuote && (
                <div className="office-modal-backdrop" onClick={() => setShowSellConfirm(false)}>
                    <div className="office-modal" onClick={event => event.stopPropagation()}>
                        <h2>{selectedShip.name}</h2>
                        <div className="office-breakdown">
                            <BreakdownRow label="Neupreis" value={`${formatMoney(sellQuote.originalPrice)} T`} />
                            <BreakdownRow label="70% Basiswert" value={`${formatMoney(sellQuote.baseSellPrice)} T`} />
                            <BreakdownRow label="Zustand" value={`${Math.round(sellQuote.condition)}% x ${Math.round(sellQuote.conditionWeight * 100)}%`} />
                            <BreakdownRow label="Tank" value={`${Math.round(sellQuote.fuel)}% x ${Math.round(sellQuote.fuelWeight * 100)}%`} />
                            <BreakdownRow label="Verkaufspreis" value={`${formatMoney(sellQuote.finalPrice)} T`} strong />
                        </div>
                        <div className="office-modal-actions">
                            <GameButton onClick={() => setShowSellConfirm(false)} disabled={actionBusy === "sell"}>Abbrechen</GameButton>
                            <GameButton onClick={handleSell} disabled={actionBusy === "sell"}>
                                {actionBusy === "sell" ? "Verkaufe..." : "Verkauf bestätigen"}
                            </GameButton>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="shipclass-toast">{toast}</div>}
        </div>
    );
}

function OfficeStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="office-stat">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function ActionCard({
                        title,
                        info,
                        cost,
                        disabled,
                        buttonText,
                        onClick,
                    }: {
    title: string;
    info: string;
    cost?: string;
    disabled: boolean;
    buttonText: string;
    onClick: () => void;
}) {
    return (
        <div className="office-action-card">
            <h3>{title}</h3>
            <span>{info}</span>
            {cost && <strong>{cost}</strong>}
            <GameButton onClick={onClick} disabled={disabled}>{buttonText}</GameButton>
        </div>
    );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={`office-breakdown-row ${strong ? "strong" : ""}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function portName(portId?: string) {
    if (!portId) return "-";
    return window.__latestPorts?.find(port => port.id === portId)?.name ?? portId;
}

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        AT_PORT: "Im Hafen",
        EN_ROUTE: "Auf Reise",
        LOADING: "Lädt",
        UNLOADING: "Entlädt",
        READY_TO_DEPART: "Bereit",
        IN_REGISTRATION: "Registrierung",
        DAMAGED: "Beschädigt",
        REFUELING: "Tankt",
        REPAIRING: "Repariert",
    };
    return labels[status] ?? status;
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
    return Number(value).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function TickProgressBar({ completionTick, label }: { completionTick: number; label: string }) {
    const [currentTick, setCurrentTick] = useState(
        window.__latestTick?.currentTick ?? 0
    );

    const [startTick] = useState(currentTick);

    useEffect(() => {
        function onTick(e: Event) {
            setCurrentTick((e as CustomEvent).detail.currentTick);
        }
        function onShipPos(e: Event) {
            const tick = (e as CustomEvent).detail?.currentTick;
            if (tick != null) setCurrentTick(tick);
        }
        window.addEventListener("backend-tick-update", onTick);
        window.addEventListener("backend-ship-positions", onShipPos);
        return () => {
            window.removeEventListener("backend-tick-update", onTick);
            window.removeEventListener("backend-ship-positions", onShipPos);
        };
    }, []);

    const ticksRemaining = Math.max(0, completionTick - currentTick);
    const totalDuration = Math.max(1, completionTick - startTick);
    const elapsed = currentTick - startTick;
    const pct = ticksRemaining <= 0 ? 100 : Math.max(5, (elapsed / totalDuration) * 100);

    return (
        <div className="office-tick-progress">
            <div className="office-tick-progress-header">
                <span className="office-tick-progress-label">{label}…</span>
                <span className="office-tick-progress-remaining">
                    {ticksRemaining > 0 ? `noch ${ticksRemaining} Tick${ticksRemaining !== 1 ? "s" : ""}` : "Fertig!"}
                </span>
            </div>
            <div className="office-tick-progress-track">
                <div className="office-tick-progress-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
