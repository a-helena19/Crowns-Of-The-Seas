import { useEffect, useState } from "react";
import GameButton from "../components/GameButton";
import "../style/shipManagement.css";

interface ShipDetails {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    maxFuel: number;
    operatingCost: number;
}

interface Props {
    playerShipId: string;
    onActionComplete: (type: "refuel" | "repair", shipName: string) => void;
    onCancel: () => void;
}

const FUEL_PRICE_PER_UNIT = 3.0;
const REPAIR_PRICE_FACTOR = 50.0;

export default function ShipManagementScene({ playerShipId, onActionComplete, onCancel }: Props) {
    const [ship, setShip] = useState<ShipDetails | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refueling, setRefueling] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setShip({
                    id: shipData.id,
                    name: shipData.name,
                    fuel: shipData.fuel,
                    condition: shipData.condition,
                    maxFuel: parseFloat(shipData.maxFuel),
                    operatingCost: parseFloat(shipData.operatingCost),
                });
                setBalance(typeof bal === "number" ? bal : parseFloat(bal));
            })
            .catch(() => setError("Schiff konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [playerShipId, playerId, sessionId, token]);

    const fuelNeededPercent = ship ? Math.max(0, 100 - ship.fuel) : 0;
    const fuelCost = ship
        ? Math.round((fuelNeededPercent / 100) * ship.maxFuel * FUEL_PRICE_PER_UNIT * 100) / 100
        : 0;

    const repairNeededPercent = ship ? Math.max(0, 100 - ship.condition) : 0;
    const repairCost = ship
        ? Math.round((repairNeededPercent / 100) * ship.operatingCost * REPAIR_PRICE_FACTOR * 100) / 100
        : 0;

    const canAffordFuel = balance !== null && balance >= fuelCost;
    const canAffordRepair = balance !== null && balance >= repairCost;
    const alreadyFull = fuelNeededPercent < 0.01;
    const alreadyRepaired = repairNeededPercent < 0.01;

    function barColor(pct: number) {
        if (pct < 25) return "bar-low";
        if (pct < 60) return "bar-mid";
        return "bar-ok";
    }

    async function handleRefuel() {
        if (!playerId || !sessionId || !ship || alreadyFull || !canAffordFuel) return;
        setRefueling(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/ships/${playerShipId}/refuel?playerId=${playerId}&sessionId=${sessionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                setError(res.status === 400 ? "Nicht genug Credits." : "Betanken fehlgeschlagen.");
                setRefueling(false);
                return;
            }
            const data = await res.json();
            setBalance(data.newBalance);
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            setError(`Wird betankt… (${data.refuelingDurationTicks} Ticks)`);
            setTimeout(() => onActionComplete("refuel", ship.name), 1500);
        } catch {
            setError("Verbindungsfehler.");
            setRefueling(false);
        }
    }

    async function handleRepair() {
        if (!playerId || !sessionId || !ship || alreadyRepaired || !canAffordRepair) return;
        setRepairing(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/ships/${playerShipId}/repair?playerId=${playerId}&sessionId=${sessionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                setError(res.status === 400 ? "Nicht genug Credits." : "Reparatur fehlgeschlagen.");
                setRepairing(false);
                return;
            }
            const data = await res.json();
            setBalance(data.newBalance);
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
            setError(`Wird repariert… (${data.repairingDurationTicks} Ticks)`);
            setTimeout(() => onActionComplete("repair", ship.name), 1500);
        } catch {
            setError("Verbindungsfehler.");
            setRepairing(false);
        }
    }

    if (loading) {
        return (
            <div className="mgmt-scene">
                <div className="mgmt-panel">
                    <div className="mgmt-loading">Laden…</div>
                </div>
            </div>
        );
    }

    if (!ship) {
        return (
            <div className="mgmt-scene">
                <div className="mgmt-panel">
                    <p className="mgmt-error">{error ?? "Fehler."}</p>
                    <GameButton onClick={onCancel}>Zurück</GameButton>
                </div>
            </div>
        );
    }

    return (
        <div className="mgmt-scene">
            <div className="mgmt-panel">

                <div className="mgmt-header">
                    <span className="mgmt-header-icon">⚙️</span>
                    <h2 className="mgmt-title">Schiffsverwaltung</h2>
                </div>

                <div className="mgmt-ship-overview">
                    <div className="mgmt-ship-name">{ship.name}</div>
                    <div className="mgmt-bars">
                        <div className="mgmt-bar-row">
                            <span className="mgmt-bar-label">⛽ Treibstoff</span>
                            <span className={`mgmt-bar-value ${barColor(ship.fuel)}`}>{ship.fuel.toFixed(0)}%</span>
                        </div>
                        <div className="mgmt-bar-track">
                            <div className={`mgmt-bar-fill ${barColor(ship.fuel)}`} style={{ width: `${ship.fuel}%` }} />
                        </div>
                        <div className="mgmt-bar-row" style={{ marginTop: 8 }}>
                            <span className="mgmt-bar-label">🔧 Zustand</span>
                            <span className={`mgmt-bar-value ${barColor(ship.condition)}`}>{ship.condition.toFixed(0)}%</span>
                        </div>
                        <div className="mgmt-bar-track">
                            <div className={`mgmt-bar-fill ${barColor(ship.condition)}`} style={{ width: `${ship.condition}%` }} />
                        </div>
                    </div>
                    {balance !== null && (
                        <div className="mgmt-balance">Kontostand: <strong>{balance.toLocaleString("de-DE")} T</strong></div>
                    )}
                </div>

                <div className="mgmt-actions-grid">
                    <div className="mgmt-action-card">
                        <div className="mgmt-action-title">⛽ Betanken</div>
                        {alreadyFull ? (
                            <div className="mgmt-action-done">Tank ist voll</div>
                        ) : (
                            <>
                                <div className="mgmt-action-info">
                                    <span>Fehlend</span>
                                    <span>{fuelNeededPercent.toFixed(0)}%</span>
                                </div>
                                <div className="mgmt-action-cost">
                                    <span>Kosten</span>
                                    <span className="mgmt-cost-value">{fuelCost.toLocaleString("de-DE")} T</span>
                                </div>
                                {!canAffordFuel && <div className="mgmt-action-warn">Nicht genug Credits</div>}
                            </>
                        )}
                        <GameButton
                            onClick={handleRefuel}
                            disabled={refueling || alreadyFull || !canAffordFuel}
                        >
                            {refueling ? "Läuft…" : "Betanken"}
                        </GameButton>
                    </div>

                    <div className="mgmt-action-card">
                        <div className="mgmt-action-title">🔧 Reparieren</div>
                        {alreadyRepaired ? (
                            <div className="mgmt-action-done">Schiff ist heil</div>
                        ) : (
                            <>
                                <div className="mgmt-action-info">
                                    <span>Schäden</span>
                                    <span>{repairNeededPercent.toFixed(0)}%</span>
                                </div>
                                <div className="mgmt-action-cost">
                                    <span>Kosten</span>
                                    <span className="mgmt-cost-value">{repairCost.toLocaleString("de-DE")} T</span>
                                </div>
                                {!canAffordRepair && <div className="mgmt-action-warn">Nicht genug Credits</div>}
                            </>
                        )}
                        <GameButton
                            onClick={handleRepair}
                            disabled={repairing || alreadyRepaired || !canAffordRepair}
                        >
                            {repairing ? "Läuft…" : "Reparieren"}
                        </GameButton>
                    </div>

                </div>

                {error && <div className="mgmt-error">{error}</div>}

                <div className="mgmt-close-row">
                    <GameButton onClick={onCancel}>Schließen</GameButton>
                </div>
            </div>
        </div>
    );
}
