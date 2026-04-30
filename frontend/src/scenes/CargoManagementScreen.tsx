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
    onCargoPhaseChange: (cargoId: string, phase: AssignedCargoEntry["phase"], travelId?: string) => void;
    onClose: () => void;
}

export default function CargoManagementScreen({
                                                  assignedCargos,
                                                  onCargoLoadingDone,
                                                  onCargoRemoved,
                                                  onCargoPhaseChange,
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

    function getElapsedSeconds(entry: AssignedCargoEntry): number {
        return (Date.now() - entry.loadingStartedAt) / 1000;
    }

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
                const data = await response.json() as { travelId?: string };
                window.dispatchEvent(new CustomEvent("player-balance-updated"));
                setShowDeparture(entry);
                onCargoPhaseChange(entry.cargoId, "en_route", data.travelId);
            } else {
                const text = await response.text();
                let msg = "Reise konnte nicht gestartet werden.";
                try {
                    const errData = JSON.parse(text) as { error?: string; message?: string };
                    if (errData.error === "CARGO_TAKEN") msg = "Fracht wurde bereits vergeben.";
                    else if (errData.error === "CAPACITY_EXCEEDED") msg = "Schiff zu klein für diese Fracht.";
                    else if (errData.error === "INSUFFICIENT_FUEL") msg = errData.message ?? "Nicht genug Treibstoff.";
                    else if (errData.error === "INSUFFICIENT_BALANCE") msg = errData.message ?? "Nicht genug Taler für den Lotsendienst.";
                    else msg = errData.message ?? msg;
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

                        const statusLabel = {
                            loading: isDone ? "✅ Bereit zur Abfahrt" : "⏳ Wird beladen…",
                            en_route: `🚢 Unterwegs — noch ${(entry.arrivalTick ?? 0) - (entry.currentTick ?? 0)} Ticks`,
                            unloading: "⚓ Wird entladen…",
                            completed: `💰 +${entry.reward?.toLocaleString("de-DE")} G`,
                        }[entry.phase] ?? "…";

                        return (
                            <div
                                key={entry.cargoId}
                                className={`cm-cargo-item ${selectedCargoId === entry.cargoId ? "active" : ""} phase-${entry.phase}`}
                                onClick={() => setSelectedCargoId(entry.cargoId)}
                            >
                                <div className="cm-cargo-ship">🚢 {entry.shipName}</div>
                                <div className="cm-cargo-route">{entry.from} → {entry.to}</div>
                                <div className="cm-cargo-status">{statusLabel}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Rechte Spalte: Detail-Ansicht der ausgewählten Fracht */}
                {selectedEntry && (
                    <div className="cm-detail-panel">
                        {selectedEntry.phase === "loading" && (
                            <>
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
                            </>
                        )}

                        {selectedEntry.phase === "en_route" && (
                            <div className="cm-travel-panel">
                                <div className="cm-travel-title">⛵ Auf Reise</div>
                                <div className="cm-travel-route">{selectedEntry.from} → {selectedEntry.to}</div>
                                <div className="cm-travel-ticks">
                                    Ankunft in {Math.max(0, (selectedEntry.arrivalTick ?? 0) - (selectedEntry.currentTick ?? 0))} Tagen
                                </div>
                                <div className="progress-track" style={{ marginTop: 12 }}>
                                    {(() => {
                                        const total = selectedEntry.arrivalTick ?? 1;
                                        const elapsed = selectedEntry.currentTick ?? 0;
                                        const pct = Math.min(100, (elapsed / total) * 100);
                                        return <div className="progress-fill-done" style={{ width: `${pct}%` }} />;
                                    })()}
                                </div>
                            </div>
                        )}

                        {selectedEntry.phase === "unloading" && (
                            <div className="cm-travel-panel">
                                <div className="cm-travel-title">⚓ Wird entladen…</div>
                                <div className="cm-travel-route">{selectedEntry.to}</div>
                                {selectedEntry.unloadingCompletedAtTick != null && (
                                    <>
                                        <div className="cm-travel-ticks">
                                            Fertig in {Math.max(0, selectedEntry.unloadingCompletedAtTick - (selectedEntry.currentTick ?? 0))} Tagen
                                        </div>
                                        <div className="progress-track" style={{ marginTop: 12 }}>
                                            <div
                                                className="progress-fill-done"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0,
                                                        100 - ((selectedEntry.unloadingCompletedAtTick - (selectedEntry.currentTick ?? 0)) / 3 * 100)
                                                    ))}%`
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {selectedEntry.phase === "completed" && (
                            <div className="cm-reward-panel">
                                <div className="cm-reward-title">🎉 Lieferung abgeschlossen!</div>
                                <div className="cm-reward-route">{selectedEntry.from} → {selectedEntry.to}</div>
                                <div className="cm-reward-amount">
                                    +{selectedEntry.reward?.toLocaleString("de-DE")} T
                                </div>
                                {selectedEntry.rewardDetails && (
                                    <>
                                        <div className="cm-reward-detail">
                                            {selectedEntry.rewardDetails.percentage.toFixed(0)}% der Basisbelohnung
                                        </div>
                                        <div className="cm-reward-breakdown">
                                            <div className="cm-reward-row">
                                                <span>Basisbelohnung</span>
                                                <span>{selectedEntry.rewardDetails.baseReward.toLocaleString("de-DE")} T</span>
                                            </div>
                                            <div className="cm-reward-row">
                                                <span>Ausbezahlt ({selectedEntry.rewardDetails.percentage.toFixed(0)}%)</span>
                                                <span>{selectedEntry.rewardDetails.actualReward.toLocaleString("de-DE")} T</span>
                                            </div>
                                            {selectedEntry.rewardDetails.percentage < 100 && (
                                                <div className="cm-reward-row warn">
                                                    <span>⚠ Fracht war abgelaufen</span>
                                                    <span>−{(selectedEntry.rewardDetails.baseReward - selectedEntry.rewardDetails.actualReward).toLocaleString("de-DE")} T</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                <button
                                    className="game-btn"
                                    onClick={() => onCargoRemoved(selectedEntry.cargoId)}
                                    style={{ marginTop: 12 }}
                                >
                                    Schließen
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showDeparture && (
                <DepartureAnimation
                    shipIconUrl={showDeparture.shipIconUrl ?? "/fallback-ship.png"}
                    onComplete={() => {
                        setShowDeparture(null);
                    }}
                />
            )}
        </div>
    );
}