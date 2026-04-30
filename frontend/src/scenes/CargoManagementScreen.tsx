import { useState, useEffect, useRef } from "react";

// Fließender Fortschrittsbalken: interpoliert zwischen Tick-Updates mit CSS-Transition.
function SmoothProgressBar({ targetPct, color }: { targetPct: number; color: string }) {
    const [displayPct, setDisplayPct] = useState(targetPct);
    const [transitionMs, setTransitionMs] = useState(0);
    const prevTargetRef = useRef(targetPct);

    useEffect(() => {
        if (targetPct === prevTargetRef.current) return;
        // Transition-Dauer = Tick-Rate des Backends (oder 5 s als Fallback)
        const tickMs = (window as unknown as { __tickRateMs?: number }).__tickRateMs ?? 5000;
        setTransitionMs(tickMs * 0.95);
        setDisplayPct(targetPct);
        prevTargetRef.current = targetPct;
    }, [targetPct]);

    return (
        <div className="progress-track" style={{ marginTop: 12 }}>
            <div
                className="progress-fill-smooth"
                style={{
                    width: `${Math.min(100, Math.max(0, displayPct))}%`,
                    transition: transitionMs > 0 ? `width ${transitionMs}ms linear` : "none",
                    background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                }}
            />
        </div>
    );
}

// Wrapper der sich die erste bekannte Restdauer merkt, um Prozent korrekt zu berechnen.
function TravelProgressBar({ remaining, color }: { remaining: number; color: string }) {
    const initialRef = useRef<number | null>(null);
    if (initialRef.current === null && remaining > 0) {
        initialRef.current = remaining;
    }
    const total = initialRef.current ?? remaining;
    const pct = total > 0 ? Math.min(100, (1 - remaining / total) * 100) : 100;
    return <SmoothProgressBar targetPct={pct} color={color} />;
}
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

        // Retry-Logik: Das Backend setzt den Schiffsstatus erst beim nächsten
        // Tick auf READY_TO_DEPART. Falls das Frontend schon früher den Button
        // freigibt (lokaler Timer abgelaufen), warten wir kurz und versuchen es
        // nochmal, anstatt sofort einen Fehler anzuzeigen.
        const MAX_RETRIES = 5;
        const RETRY_DELAY_MS = 1500;

        const attemptStart = async (retriesLeft: number): Promise<void> => {
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
                    return;
                }

                const text = await response.text();
                let errorCode: string | undefined;
                let msg = "Reise konnte nicht gestartet werden.";
                try {
                    const errData = JSON.parse(text) as { error?: string; message?: string };
                    errorCode = errData.error;
                    if (errData.error === "CARGO_TAKEN") msg = "Fracht wurde bereits vergeben.";
                    else if (errData.error === "CAPACITY_EXCEEDED") msg = "Schiff zu klein für diese Fracht.";
                    else if (errData.error === "INSUFFICIENT_FUEL") msg = errData.message ?? "Nicht genug Treibstoff.";
                    else if (errData.error === "INSUFFICIENT_BALANCE") msg = errData.message ?? "Nicht genug Taler für den Lotsendienst.";
                    else msg = errData.message ?? msg;
                } catch { /* noop */ }

                // Wenn der Fehler darauf hindeutet, dass das Schiff noch nicht
                // READY_TO_DEPART ist (Beladung im Backend noch nicht abgeschlossen),
                // kurz warten und erneut versuchen.
                const isLoadingNotDone = errorCode === "SHIP_NOT_READY";

                if (isLoadingNotDone && retriesLeft > 0) {
                    await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    return attemptStart(retriesLeft - 1);
                }

                setErrorMap(m => ({ ...m, [entry.cargoId]: msg }));
            } catch {
                if (retriesLeft > 0) {
                    await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    return attemptStart(retriesLeft - 1);
                }
                setErrorMap(m => ({ ...m, [entry.cargoId]: "Verbindungsfehler." }));
            }
        };

        try {
            await attemptStart(MAX_RETRIES);
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
                                {(() => {
                                    const remaining = Math.max(0, (selectedEntry.arrivalTick ?? 0) - (selectedEntry.currentTick ?? 0));
                                    return <TravelProgressBar remaining={remaining} color="#ff9800" />;
                                })()}
                            </div>
                        )}

                        {selectedEntry.phase === "unloading" && (
                            <div className="loading-panel">
                                <div className="loading-title">
                                    Schiff wird entladen
                                    <span className="loading-dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>

                                <div className="loading-ship-wrap">
                                    <span className="unload-box">📦</span>
                                    <span className="unload-box">📦</span>
                                    <span className="unload-box">📦</span>
                                    <img
                                        src={selectedEntry.shipIconUrl ?? "/fallback-ship.png"}
                                        alt={selectedEntry.shipName}
                                        className="loading-ship-img"
                                        onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                                    />
                                </div>

                                <div className="loading-route">
                                    {selectedEntry.from} → {selectedEntry.to}
                                </div>

                                <div className="loading-capacity">
                                    <div className="loading-capacity-label">
                                        <span>Ladekapazität</span>
                                        <span>{selectedEntry.weight}t / {selectedEntry.maxCargoCapacity > 0 ? `${selectedEntry.maxCargoCapacity}t` : "–"}</span>
                                    </div>
                                    <div className="capacity-track">
                                        <div className="capacity-fill ok" style={{
                                            width: `${selectedEntry.maxCargoCapacity > 0 ? Math.min((selectedEntry.weight / selectedEntry.maxCargoCapacity) * 100, 100) : 100}%`
                                        }} />
                                    </div>
                                </div>

                                {selectedEntry.unloadingCompletedAtTick != null && (
                                    <div className="loading-progress-wrap">
                                        <div className="loading-progress-label">Entladevorgang</div>
                                        {(() => {
                                            const remaining = Math.max(0, selectedEntry.unloadingCompletedAtTick - (selectedEntry.currentTick ?? 0));
                                            return <TravelProgressBar remaining={remaining} color="#2196f3" />;
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedEntry.phase === "completed" && (() => {
                            const isPerfect = !selectedEntry.rewardDetails || selectedEntry.rewardDetails.percentage >= 100;
                            const details = selectedEntry.rewardDetails;
                            return (
                                <div className="cm-reward-panel">
                                    {/* Header */}
                                    <div className="cm-reward-header">
                                        <span>{isPerfect ? '🌟' : '⚓'}</span>
                                        <div className="cm-reward-title">
                                            {isPerfect ? 'Perfekte Reise!' : 'Reise abgeschlossen!'}
                                        </div>
                                    </div>

                                    {isPerfect && (
                                        <div className="cm-reward-perfect-badge">
                                            100% Lieferquote — alle Frachten erfolgreich abgeliefert!
                                        </div>
                                    )}

                                    {/* Frachtbilanz */}
                                    <div className="cm-reward-section-label">
                                        Frachtbilanz (1)
                                    </div>
                                    <div className={`cm-reward-cargo-item${!isPerfect ? " expired" : ""}`}>
                                        <div style={{ flex: 1 }}>
                                            <div className="cm-reward-cargo-name">{selectedEntry.from} → {selectedEntry.to}</div>
                                            <div className="cm-reward-cargo-sub">→ {selectedEntry.to}</div>
                                        </div>
                                        <span className={`cm-reward-cargo-amount${!isPerfect ? " expired" : ""}`}>
                                            +{(details?.actualReward ?? selectedEntry.reward ?? 0).toLocaleString("de-DE")}T
                                        </span>
                                    </div>

                                    {/* Summary */}
                                    {details && (
                                        <div className="cm-reward-breakdown">
                                            <div className="cm-reward-row">
                                                <span>Cargo Belohnung</span>
                                                <span className="cm-reward-row-value">+{details.actualReward.toLocaleString("de-DE")}T</span>
                                            </div>
                                            {isPerfect && (
                                                <div className="cm-reward-row bonus">
                                                    <span>🎁 Reise Bonus</span>
                                                    <span>+{details.actualReward.toLocaleString("de-DE")}T</span>
                                                </div>
                                            )}
                                            {!isPerfect && (
                                                <div className="cm-reward-row warn">
                                                    <span>⚠ Fracht war abgelaufen ({details.percentage.toFixed(0)}%)</span>
                                                    <span>−{(details.baseReward - details.actualReward).toLocaleString("de-DE")}T</span>
                                                </div>
                                            )}
                                            <div className="cm-reward-row total">
                                                <span>Gesamt</span>
                                                <span className="cm-reward-row-value">
                                                    +{(selectedEntry.reward ?? 0).toLocaleString("de-DE")}T
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Weiter-Button */}
                                    <button
                                        className="cm-reward-btn"
                                        onClick={() => onCargoRemoved(selectedEntry.cargoId)}
                                    >
                                        Fracht schließen
                                    </button>
                                </div>
                            );
                        })()}
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