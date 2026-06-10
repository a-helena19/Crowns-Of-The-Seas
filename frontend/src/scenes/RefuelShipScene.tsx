import { useEffect, useRef, useState } from "react";
import GameButton from "../components/GameButton";
import "../style/refuelShip.css";

interface ShipDetails {
    id: string;
    name: string;
    fuel: number;
    maxFuel: number;
}

interface RefuelResponse {
    currentFuelPercent: number;
    totalCost: number;
    newBalance: number;
}

interface Props {
    playerShipId: string;
    onRefuelComplete: () => void;
    onCancel: () => void;
}

const FUEL_PRICE_PER_UNIT = 8.0;

export default function RefuelShipScene({ playerShipId, onRefuelComplete, onCancel }: Props) {
    const [ship, setShip] = useState<ShipDetails | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refueling, setRefueling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetFuelPercent, setTargetFuelPercent] = useState<number>(100);
    const animDoneRef = useRef(false);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerId || !sessionId) return;
        Promise.all([
            fetch(`/api/ships/${playerShipId}/player/${playerId}?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()),
            fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()),
        ])
            .then(([shipData, bal]) => {
                setShip({ id: shipData.id, name: shipData.name, fuel: shipData.fuel, maxFuel: shipData.maxFuel });
                setBalance(typeof bal === "number" ? bal : parseFloat(bal));
                setTargetFuelPercent(100);
            })
            .catch(() => setError("Schiff konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [playerShipId, playerId, sessionId, token]);

    const sliderMin = ship ? Math.min(99, Math.ceil(ship.fuel) + 1) : 1;
    const effectiveTarget = ship ? Math.max(sliderMin, targetFuelPercent) : 100;
    const fuelToAddPercent = ship ? Math.max(0, effectiveTarget - ship.fuel) : 0;
    const fuelToAddAbsolute = ship ? (fuelToAddPercent / 100) * ship.maxFuel : 0;
    const totalCost = Math.round(fuelToAddAbsolute * FUEL_PRICE_PER_UNIT);
    const canAfford = balance !== null && balance >= totalCost;
    const alreadyFull = ship ? ship.fuel >= 99.99 : false;

    function fuelColorClass(percent: number) {
        if (percent < 25) return "fuel-low";
        if (percent < 60) return "fuel-mid";
        return "fuel-ok";
    }

    async function handleRefuel() {
        if (!playerId || !sessionId || !ship || alreadyFull || !canAfford) return;
        setRefueling(true);
        setError(null);
        animDoneRef.current = false;

        try {
            const res = await fetch(
                `/api/ships/${playerShipId}/refuel?playerId=${playerId}&sessionId=${sessionId}&targetFuelPercent=${effectiveTarget}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                const msg = res.status === 400 ? "Nicht genug Credits." : "Betanken fehlgeschlagen.";
                setError(msg);
                setRefueling(false);
                return;
            }
            const data: RefuelResponse = await res.json();
            setShip(prev => prev ? { ...prev, fuel: data.currentFuelPercent } : prev);
            setBalance(data.newBalance);
            window.dispatchEvent(new CustomEvent("player-balance-updated"));

            setTimeout(() => {
                onRefuelComplete();
            }, 1600);
        } catch {
            setError("Verbindungsfehler.");
            setRefueling(false);
        }
    }

    if (loading) {
        return (
            <div className="refuel-scene">
                <div className="refuel-panel">
                    <div className="refuel-loading">Laden…</div>
                </div>
            </div>
        );
    }

    if (!ship) {
        return (
            <div className="refuel-scene">
                <div className="refuel-panel">
                    <p className="refuel-error">{error ?? "Fehler."}</p>
                    <GameButton onClick={onCancel}>Zurück</GameButton>
                </div>
            </div>
        );
    }

    const startPct = ship.fuel;

    return (
        <div className="refuel-scene">
            <div className="refuel-panel">
                <div className="refuel-header">
                    <span className="refuel-icon">⛽</span>
                    <h2 className="refuel-title">Betanken</h2>
                </div>

                <div className="refuel-ship-name">{ship.name}</div>

                <div className="refuel-fuel-section">
                    <div className="refuel-fuel-label">
                        <span>Treibstoff</span>
                        <span className={`refuel-fuel-value ${fuelColorClass(ship.fuel)}`}>
                            {refueling ? effectiveTarget.toFixed(0) : ship.fuel.toFixed(0)}%
                        </span>
                    </div>
                    <div className="refuel-bar-track">
                        <div
                            className={`refuel-bar-fill ${fuelColorClass(startPct)}${refueling ? " animating" : ""}`}
                            style={{
                                "--fuel-start": `${startPct}%`,
                                "--fuel-target": `${effectiveTarget}%`
                            } as React.CSSProperties}
                        />
                    </div>
                </div>

                {alreadyFull ? (
                    <div className="refuel-info-row refuel-full-msg">Tank ist bereits voll!</div>
                ) : (
                    <>
                        <div className="refuel-slider-section">
                            <div className="refuel-slider-label">
                                <span>Ziel-Tankstand</span>
                                <span className="refuel-slider-value">{effectiveTarget}%</span>
                            </div>
                            <input
                                type="range"
                                className="refuel-slider"
                                min={sliderMin}
                                max={100}
                                step={5}
                                value={effectiveTarget}
                                onChange={e => setTargetFuelPercent(Number(e.target.value))}
                                disabled={refueling}
                            />
                            <div className="refuel-slider-ticks">
                                <span>{sliderMin}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div className="refuel-cost-section">
                            <div className="refuel-info-row">
                                <span>Menge</span>
                                <span>{fuelToAddAbsolute.toFixed(0)} Einheiten (+{fuelToAddPercent.toFixed(0)}%)</span>
                            </div>
                            <div className="refuel-info-row refuel-cost-row">
                                <span>Kosten</span>
                                <span className="refuel-cost-value">{formatTalers(totalCost)} T</span>
                            </div>
                            <div className="refuel-info-row">
                                <span>Kontostand</span>
                                <span className={canAfford ? "refuel-balance-ok" : "refuel-balance-low"}>
                                    {balance !== null ? formatTalers(balance) : "-"} T
                                </span>
                            </div>
                            {!canAfford && (
                                <div className="refuel-error">Nicht genug Credits!</div>
                            )}
                        </div>
                    </>
                )}

                {error && <div className="refuel-error">{error}</div>}

                <div className="refuel-actions">
                    {!refueling && (
                        <GameButton onClick={onCancel}>Abbrechen</GameButton>
                    )}
                    <GameButton
                        onClick={handleRefuel}
                        disabled={refueling || alreadyFull || !canAfford}
                    >
                        {refueling ? "Betanken…" : "Betanken"}
                    </GameButton>
                </div>
            </div>
        </div>
    );
}

function formatTalers(value: number) {
    return Math.round(value).toLocaleString("de-DE", { maximumFractionDigits: 0 });
}
