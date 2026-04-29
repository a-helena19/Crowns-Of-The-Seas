import { useState } from "react";
import LoadingScreen from "./LoadingScreen";
import backIcon from "../assets/goback.png";
import background from "../assets/background.jpg";
import "../style/harbor.css";
import "../style/cargoManagement.css";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import DepartureAnimation from "./DepartureAnimation";

interface CargoManagementScreenProps {
    assignedCargos: AssignedCargoEntry[];
    onCargoLoadingDone: (cargoId: string) => void;
    onCargoRemoved: (cargoId: string) => void;
    onClose: () => void;
}

export default function CargoManagementScreen({
                                                  assignedCargos,
                                                  onCargoLoadingDone,
                                                  onCargoRemoved,
                                                  onClose,
                                              }: CargoManagementScreenProps) {
    const [selectedCargoId, setSelectedCargoId] = useState<string | null>(
        assignedCargos[0]?.cargoId ?? null
    );
    const [pilotageMap, setPilotageMap] = useState<Record<string, boolean>>({});
    const [startingMap, setStartingMap] = useState<Record<string, boolean>>({});
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});
    const [showDeparture, setShowDeparture] = useState<AssignedCargoEntry | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    const selectedEntry = assignedCargos.find(e => e.cargoId === selectedCargoId) ?? null;

    // Berechnet wie viele Sekunden seit loadingStartedAt vergangen sind
    function getElapsedSeconds(entry: AssignedCargoEntry): number {
        return (Date.now() - entry.loadingStartedAt) / 1000;
    }

    // Verbleibende Ladezeit in Sekunden
    function getRemainingSeconds(entry: AssignedCargoEntry): number {
        return Math.max(0, entry.loadingDurationSeconds - getElapsedSeconds(entry));
    }

    async function handleStartTravel(entry: AssignedCargoEntry) {
        if (!playerId || !sessionId) return;
        setStartingMap(m => ({ ...m, [entry.cargoId]: true }));
        setErrorMap(m => ({ ...m, [entry.cargoId]: "" }));
        try {
            const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    playerShipId: entry.shipId,
                    destinationPortId: entry.destinationPortId,
                    sessionCargoId: entry.cargoId,
                    speedSetting: entry.speedSetting,
                    pilotageService: pilotageMap[entry.cargoId] ?? false,
                }),
            });
            if (response.ok) {
                window.dispatchEvent(new CustomEvent("player-balance-updated"));
                setShowDeparture(entry);
                onCargoRemoved(entry.cargoId);
            } else {
                const text = await response.text();
                let msg = "Reise konnte nicht gestartet werden.";
                try {
                    const data = JSON.parse(text) as { error?: string; message?: string };
                    if (data.error === "CARGO_TAKEN") msg = "Fracht wurde bereits vergeben.";
                    else if (data.error === "CAPACITY_EXCEEDED") msg = "Schiff zu klein für diese Fracht.";
                    else if (data.error === "INSUFFICIENT_FUEL") msg = data.message ?? "Nicht genug Treibstoff.";
                    else if (data.error === "INSUFFICIENT_BALANCE") msg = data.message ?? "Nicht genug Taler für den Lotsendienst.";
                    else msg = data.message ?? msg;
                } catch { /* noop */ }
                setErrorMap(m => ({ ...m, [entry.cargoId]: msg }));
            }
        } catch {
            setErrorMap(m => ({ ...m, [entry.cargoId]: "Verbindungsfehler." }));
        } finally {
            setStartingMap(m => ({ ...m, [entry.cargoId]: false }));
        }
    }

    return (
        <div className="scene">
            <img src={background} className="background" alt="" />
            <div className="back-icon-btn" onClick={onClose}>
                <img src={backIcon} alt="Zurück" />
            </div>

            <div className="cm-layout">
                {/* Linke Spalte: Liste der zugewiesenen Frachten */}
                <div className="cm-list-panel">
                    <div className="cm-panel-title">Zugewiesene Frachten</div>
                    {assignedCargos.length === 0 && (
                        <div className="cm-empty">
                            Keine Frachten zugewiesen.<br />
                            <span>Gehe zum Hafen und nimm eine Fracht an.</span>
                        </div>
                    )}
                    {assignedCargos.map(entry => {
                        const remaining = getRemainingSeconds(entry);
                        const isDone = entry.loadingDone || remaining <= 0;
                        return (
                            <div
                                key={entry.cargoId}
                                className={`cm-cargo-item ${selectedCargoId === entry.cargoId ? "active" : ""} ${isDone ? "done" : "loading"}`}
                                onClick={() => setSelectedCargoId(entry.cargoId)}
                            >
                                <div className="cm-cargo-ship">🚢 {entry.shipName}</div>
                                <div className="cm-cargo-route">{entry.from} → {entry.to}</div>
                                <div className="cm-cargo-status">
                                    {isDone ? "✅ Bereit zur Abfahrt" : `⏳ Wird beladen…`}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rechte Spalte: Detail-Ansicht der ausgewählten Fracht */}
                {selectedEntry && (
                    <div className="cm-detail-panel">
                        {/* Ladevorgang */}
                        <LoadingScreen
                            ship={{
                                id: selectedEntry.shipId,
                                name: selectedEntry.shipName,
                                maxCargoCapacity: selectedEntry.maxCargoCapacity,
                                iconUrl: selectedEntry.shipIconUrl,
                            }}
                            cargo={{
                                from: selectedEntry.from,
                                to: selectedEntry.to,
                                weight: selectedEntry.weight,
                            }}
                            done={selectedEntry.loadingDone || getRemainingSeconds(selectedEntry) <= 0}
                            onComplete={() => onCargoLoadingDone(selectedEntry.cargoId)}
                            loadingDurationSeconds={getRemainingSeconds(selectedEntry) > 0
                                ? getRemainingSeconds(selectedEntry)
                                : 0}
                        />

                        {/* Lotsendienst + Reise starten – nur wenn Laden fertig */}
                        {(selectedEntry.loadingDone || getRemainingSeconds(selectedEntry) <= 0) && (
                            <div className="cm-actions">
                                <div className="pilotage-row">
                                    <button
                                        className={`pilotage-toggle ${pilotageMap[selectedEntry.cargoId] ? "active" : ""}`}
                                        onClick={() =>
                                            setPilotageMap(m => ({
                                                ...m,
                                                [selectedEntry.cargoId]: !m[selectedEntry.cargoId],
                                            }))
                                        }
                                    >
                    <span className="pilotage-check">
                      {pilotageMap[selectedEntry.cargoId] ? "✓" : "○"}
                    </span>
                                        <span className="pilotage-label">Lotsendienst</span>
                                        <span className="pilotage-cost">600 Taler</span>
                                    </button>
                                </div>

                                {errorMap[selectedEntry.cargoId] && (
                                    <div className="harbor-error-toast" style={{ position: "relative", transform: "none", marginBottom: 8 }}>
                                        {errorMap[selectedEntry.cargoId]}
                                    </div>
                                )}

                                <button
                                    className="game-btn danger"
                                    onClick={() => handleStartTravel(selectedEntry)}
                                    disabled={startingMap[selectedEntry.cargoId]}
                                >
                                    {startingMap[selectedEntry.cargoId] ? "Reise wird gestartet…" : "Reise starten"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Abfahrtsanimation */}
            {showDeparture && (
                <DepartureAnimation
                    shipIconUrl={showDeparture.shipIconUrl ?? "/fallback-ship.png"}
                    onComplete={() => {
                        setShowDeparture(null);
                        onClose();
                    }}
                />
            )}
        </div>
    );
}