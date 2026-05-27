import { useState, useEffect, useCallback } from "react";
import LoadingScreen from "./LoadingScreen";
import backIcon from "../assets/goback.png";
import background from "../assets/background-cargomanagement.png";
import shipIcon from "../assets/icon-ship.png";
import "../style/harbor.css";
import "../style/cargoManagement.css";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import DepartureAnimation from "./DepartureAnimation";
import DockingMiniGame from "./DockingMiniGame";

function StaticProgressBar({ pct, color }: { pct: number; color: string }) {
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="progress-track">
            <div
                className="progress-fill-smooth"
                style={{
                    width: `${clamped}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                    transition: "none",
                }}
            />
        </div>
    );
}

function IconAnchor() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 5, opacity: 0.75 }}>
            <circle cx="7" cy="3.5" r="1.5" stroke="#5a3a0a" strokeWidth="1.2" fill="none"/>
            <line x1="7" y1="5" x2="7" y2="12" stroke="#5a3a0a" strokeWidth="1.2"/>
            <path d="M3 8.5 Q7 12 11 8.5" stroke="#5a3a0a" strokeWidth="1.2" fill="none"/>
            <line x1="3" y1="8.5" x2="3" y2="10.5" stroke="#5a3a0a" strokeWidth="1"/>
            <line x1="11" y1="8.5" x2="11" y2="10.5" stroke="#5a3a0a" strokeWidth="1"/>
        </svg>
    );
}

function IconWarning() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 5, opacity: 0.8 }}>
            <path d="M7 1.5 L12.5 11.5 L1.5 11.5 Z" stroke="#a0521a" strokeWidth="1.2" fill="none"/>
            <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#a0521a" strokeWidth="1.2"/>
            <circle cx="7" cy="10" r="0.7" fill="#a0521a"/>
        </svg>
    );
}

function IconCheck() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 5, opacity: 0.85 }}>
            <circle cx="7" cy="7" r="5.5" stroke="#2e7d32" strokeWidth="1.2" fill="none"/>
            <polyline points="4,7 6.5,9.5 10,5" stroke="#2e7d32" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </svg>
    );
}


function UnloadingStallNotice({ currentTick, completionTick }: {
    currentTick: number | undefined;
    completionTick: number | undefined;
}) {
    const [secondsWaiting, setSecondsWaiting] = useState(0);

    const isOverdue = currentTick != null
        && completionTick != null
        && currentTick >= completionTick;

    useEffect(() => {
        if (!isOverdue) {
            setSecondsWaiting(0);
            return;
        }
        const interval = setInterval(() => {
            setSecondsWaiting(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isOverdue, completionTick]);

    if (!isOverdue || secondsWaiting < 3) return null;

    return (
        <div className="cm-unloading-stall">
            <IconWarning />
            Entladen dauert länger als erwartet — System wartet auf Bestätigung ({secondsWaiting}s)
        </div>
    );
}

interface CargoManagementScreenProps {
    assignedCargos: AssignedCargoEntry[];
    activePilotStrikes?: Record<string, { portName: string }>;
    onCargoLoadingDone: (cargoId: string) => void;
    onCargoRemoved: (cargoId: string) => void;
    onCargoPhaseChange: (cargoId: string, phase: AssignedCargoEntry["phase"], travelId?: string) => void;
    onTravelStarted?: (cargoId: string, pilotageUsed: boolean, pilotageStrikeRevoked?: boolean) => void;
    onClose: () => void;
    onDepartureStarted?: () => void;
    onDepartureComplete?: () => void;
}

export default function CargoManagementScreen({
                                                  assignedCargos,
                                                  activePilotStrikes = {},
                                                  onCargoLoadingDone,
                                                  onCargoRemoved,
                                                  onCargoPhaseChange,
                                                  onTravelStarted,
                                                  onClose,
                                                  onDepartureStarted,
                                                  onDepartureComplete,
                                              }: CargoManagementScreenProps) {
    const [selectedCargoId, setSelectedCargoId] = useState<string | null>(
        assignedCargos[0]?.cargoId ?? null
    );
    const [pilotageMap, setPilotageMap] = useState<Record<string, boolean>>({});
    const [startingMap, setStartingMap] = useState<Record<string, boolean>>({});
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});
    const [showDeparture, setShowDeparture] = useState<AssignedCargoEntry | null>(null);
    const [showDockingGame, setShowDockingGame] = useState<AssignedCargoEntry | null>(null);

    const [, setRenderTick] = useState(0);
    useEffect(() => {
        const hasRunningProgress = assignedCargos.some(
            e => e.phase === "loading" && !e.loadingDone
        );
        if (!hasRunningProgress) return;
        const interval = setInterval(() => {
            setRenderTick(t => (t + 1) % 1_000_000);
        }, 100);
        return () => clearInterval(interval);
    }, [assignedCargos]);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (selectedCargoId && !assignedCargos.find(e => e.cargoId === selectedCargoId)) {
            setSelectedCargoId(assignedCargos[0]?.cargoId ?? null);
        } else if (!selectedCargoId && assignedCargos.length > 0) {
            setSelectedCargoId(assignedCargos[0].cargoId);
        }
    }, [assignedCargos, selectedCargoId]);

    const selectedEntry = assignedCargos.find(e => e.cargoId === selectedCargoId) ?? null;

    function resolveOriginPortId(entry: AssignedCargoEntry): string | undefined {
        if (entry.originPortId) return entry.originPortId;
        return window.__latestPorts?.find(p => p.name === entry.from)?.id;
    }

    function getStrikeInfo(entry: AssignedCargoEntry) {
        const originId = resolveOriginPortId(entry);
        const strikeAtOrigin = originId ? activePilotStrikes[originId] : undefined;
        const strikeAtDest = activePilotStrikes[entry.destinationPortId];
        return { strikeAtOrigin, strikeAtDest, pilotBlocked: !!(strikeAtOrigin || strikeAtDest) };
    }

    useEffect(() => {
        setPilotageMap(prev => {
            let changed = false;
            const next = { ...prev };
            for (const entry of assignedCargos) {
                if (entry.phase !== "loading") continue;
                const { pilotBlocked } = getStrikeInfo(entry);
                if (pilotBlocked && next[entry.cargoId]) {
                    next[entry.cargoId] = false;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedCargos, activePilotStrikes]);

    function getElapsedSeconds(entry: AssignedCargoEntry): number {
        return (Date.now() - entry.loadingStartedAt) / 1000;
    }

    function getRemainingSeconds(entry: AssignedCargoEntry): number {
        return Math.max(0, entry.loadingDurationSeconds - getElapsedSeconds(entry));
    }

    function getLoadingPct(entry: AssignedCargoEntry): number {
        if (entry.loadingDone) return 100;
        if (entry.loadingDurationSeconds <= 0) return 100;
        return Math.min(100, (getElapsedSeconds(entry) / entry.loadingDurationSeconds) * 100);
    }

    function getTickPct(currentTick: number | undefined, arrivalTick: number | undefined,
                        startTick: number | undefined): number {
        if (currentTick == null || arrivalTick == null) return 0;
        if (arrivalTick <= currentTick) return 100;
        if (startTick != null && arrivalTick > startTick) {
            const elapsed = currentTick - startTick;
            const total = arrivalTick - startTick;
            return Math.min(100, Math.max(0, (elapsed / total) * 100));
        }
        return 0;
    }

    const handleStartTravel = useCallback(async (entry: AssignedCargoEntry, miniGameFailed: boolean) => {
        if (!playerId || !sessionId) return;
        setStartingMap(m => ({ ...m, [entry.cargoId]: true }));
        setErrorMap(m => ({ ...m, [entry.cargoId]: "" }));

        const tickMs = (window as unknown as { __tickRateMs?: number }).__tickRateMs ?? 5000;
        const MAX_WAIT_MS = tickMs * 2.5;
        const BASE_RETRY_DELAY_MS = Math.max(500, Math.min(tickMs * 0.4, 2000));
        const MAX_RETRIES = Math.ceil(MAX_WAIT_MS / BASE_RETRY_DELAY_MS);

        const attemptStart = async (retriesLeft: number, delayMs: number): Promise<void> => {
            try {
                if (retriesLeft === MAX_RETRIES) {
                    onDepartureStarted?.();
                }
                const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        playerShipId: entry.shipId,
                        destinationPortId: entry.destinationPortId,
                        sessionCargoId: entry.cargoId,
                        speedSetting: entry.speedSetting,
                        pilotageService: pilotageMap[entry.cargoId] ?? false,
                        miniGameFailedDeparture: miniGameFailed,
                    }),
                });

                if (response.ok) {
                    const data = await response.json() as {
                        travelId?: string;
                        pilotageServiceBooked?: boolean;
                        pilotageStrikeRevoked?: boolean;
                    };
                    window.dispatchEvent(new CustomEvent("player-balance-updated"));
                    const usedPilot = data.pilotageServiceBooked ?? pilotageMap[entry.cargoId] ?? false;
                    if (usedPilot) {
                        setShowDeparture(entry);
                    } else {
                        onDepartureComplete?.();
                    }
                    onCargoPhaseChange(entry.cargoId, "en_route", data.travelId);
                    onTravelStarted?.(entry.cargoId, usedPilot, data.pilotageStrikeRevoked);
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
                    else if (errData.error === "PILOT_STRIKE") msg = errData.message ?? "Lotsenstreik — Lotsendienst nicht verfügbar.";
                    else msg = errData.message ?? msg;
                } catch { /* noop */ }

                if (errorCode === "SHIP_NOT_READY" && retriesLeft > 0) {
                    await new Promise<void>(resolve => setTimeout(resolve, delayMs));
                    return attemptStart(retriesLeft - 1, Math.min(delayMs * 1.3, tickMs));
                }

                setErrorMap(m => ({ ...m, [entry.cargoId]: msg }));
                onDepartureComplete?.();
            } catch {
                if (retriesLeft > 0) {
                    await new Promise<void>(resolve => setTimeout(resolve, delayMs));
                    return attemptStart(retriesLeft - 1, delayMs);
                }
                setErrorMap(m => ({ ...m, [entry.cargoId]: "Verbindungsfehler." }));
                onDepartureComplete?.();
            }
        };

        try {
            await attemptStart(MAX_RETRIES, BASE_RETRY_DELAY_MS);
        } finally {
            setStartingMap(m => ({ ...m, [entry.cargoId]: false }));
        }
    }, [playerId, sessionId, token, pilotageMap, onDepartureStarted, onDepartureComplete, onCargoPhaseChange, onTravelStarted]);

    const handleDepartButton = useCallback((entry: AssignedCargoEntry) => {
        if (pilotageMap[entry.cargoId]) {
            handleStartTravel(entry, false);
        } else {
            setShowDockingGame(entry);
        }
    }, [pilotageMap, handleStartTravel]);

    const handleDockingSuccess = useCallback(() => {
        if (!showDockingGame) return;
        const entry = showDockingGame;
        setShowDockingGame(null);
        handleStartTravel(entry, false);
    }, [showDockingGame, handleStartTravel]);

    const handleDockingFailure = useCallback(async () => {
        if (!showDockingGame) return;
        const entry = showDockingGame;
        setShowDockingGame(null);
        handleStartTravel(entry, true);
    }, [showDockingGame, handleStartTravel]);

    const handleDepartureComplete = useCallback(() => {
        setShowDeparture(null);
        onDepartureComplete?.();
    }, [onDepartureComplete]);

    return (
        <div className="scene">
            <img src={background} className="background" alt="" />
            {!showDeparture && (
                <div className="back-icon-btn" onClick={onClose}>
                    <img src={backIcon} alt="Zurück" />
                </div>
            )}

            <div className="cm-layout">
                <div className="cm-list-panel">
                    <div className="cm-panel-title">Zugewiesene Frachten</div>
                    <div className="cm-list-scroll">
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
                                loading: isDone ? "Bereit zur Abfahrt" : "Wird beladen …",
                                en_route: entry.paused
                                    ? "Reise unterbrochen"
                                    : `Unterwegs — noch ${Math.max(0, (entry.arrivalTick ?? 0) - (entry.currentTick ?? 0))} Tage`,
                                awaiting_docking: "Wartet auf Anlegemanöver",
                                customs_check: "Zoll wird überprüft …",
                                blocked: `Festgehalten — noch ${Math.max(0, (entry.customsBlockedUntilTick ?? 0) - (entry.currentTick ?? 0))} Tage`,
                                unloading: "Wird entladen …",
                                completed: `+${entry.reward?.toLocaleString("de-DE")} T`,
                            }[entry.phase] ?? "…";

                            return (
                                <div
                                    key={entry.cargoId}
                                    className={`cm-cargo-item ${selectedCargoId === entry.cargoId ? "active" : ""} phase-${entry.phase}`}
                                    onClick={() => setSelectedCargoId(entry.cargoId)}
                                >
                                    <div className="cm-cargo-ship">
                                        <img src={shipIcon} alt="" style={{ width: 12, height: 12, imageRendering: "pixelated", verticalAlign: "middle", marginRight: 5, opacity: 0.7 }} />
                                        {entry.shipName}
                                    </div>
                                    <div className="cm-cargo-route">{entry.from} → {entry.to}</div>
                                    <div className="cm-cargo-status">{statusLabel}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

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
                                    loadingDurationSeconds={selectedEntry.loadingDurationSeconds}
                                    elapsedRatio={getLoadingPct(selectedEntry) / 100}
                                />
                                {(selectedEntry.loadingDone || getRemainingSeconds(selectedEntry) <= 0) && (() => {
                                    const { strikeAtOrigin, strikeAtDest, pilotBlocked } = getStrikeInfo(selectedEntry);
                                    const strikeNames = [
                                        strikeAtOrigin?.portName,
                                        strikeAtDest?.portName && strikeAtDest.portName !== strikeAtOrigin?.portName
                                            ? strikeAtDest.portName
                                            : null,
                                    ].filter(Boolean);
                                    return (
                                        <div className="cm-actions">
                                            <div className="pilotage-row">
                                                <button
                                                    type="button"
                                                    className={`pilotage-toggle ${pilotageMap[selectedEntry.cargoId] ? "active" : ""}${pilotBlocked ? " disabled" : ""}`}
                                                    disabled={pilotBlocked}
                                                    onClick={() => {
                                                        if (pilotBlocked) return;
                                                        setPilotageMap(m => ({
                                                            ...m,
                                                            [selectedEntry.cargoId]: !m[selectedEntry.cargoId],
                                                        }));
                                                    }}
                                                >
                                                <span className="pilotage-check">
                                                    {pilotageMap[selectedEntry.cargoId] ? "✓" : "○"}
                                                </span>
                                                    <span className="pilotage-label">Lotsendienst</span>
                                                    <span className="pilotage-cost">600 Taler</span>
                                                </button>
                                            </div>
                                            {pilotBlocked && (
                                                <div className="pilot-strike-info">
                                                    ⚠ Lotsenstreik in {strikeNames.join(" und ")} — Lotsendienst derzeit nicht verfügbar.
                                                </div>
                                            )}
                                            {errorMap[selectedEntry.cargoId] && (
                                                <div className="harbor-error-toast" style={{ position: "relative", transform: "none", marginBottom: 8 }}>
                                                    {errorMap[selectedEntry.cargoId]}
                                                </div>
                                            )}
                                            <button
                                                className="game-btn danger"
                                                onClick={() => handleDepartButton(selectedEntry)}
                                                disabled={startingMap[selectedEntry.cargoId]}
                                            >
                                                {startingMap[selectedEntry.cargoId]
                                                    ? "Reise wird gestartet …"
                                                    : "Reise starten"}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {selectedEntry.phase === "en_route" && (() => {
                            const pct = getTickPct(
                                selectedEntry.currentTick,
                                selectedEntry.arrivalTick,
                                selectedEntry.startTick
                            );
                            const remainingTicks = Math.max(
                                0,
                                (selectedEntry.arrivalTick ?? 0) - (selectedEntry.currentTick ?? 0)
                            );
                            return (
                                <div className="cm-travel-panel">
                                    <div className="cm-travel-header">
                                        <img src={shipIcon} alt="" className="cm-travel-icon" />
                                        <div className="cm-travel-title">Auf Reise</div>
                                    </div>
                                    <div className="cm-travel-route">{selectedEntry.from} → {selectedEntry.to}</div>
                                    {selectedEntry.paused ? (
                                        <div className="cm-travel-paused">
                                            <IconAnchor />
                                            Reise unterbrochen
                                        </div>
                                    ) : (
                                        <>
                                            <div className="cm-travel-ticks">
                                                Ankunft in {remainingTicks} {remainingTicks === 1 ? "Tag" : "Tagen"}
                                            </div>
                                            <StaticProgressBar pct={pct} color="#c89b3c" />
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {selectedEntry.phase === "customs_check" && (() => {
                            const pct = getTickPct(
                                selectedEntry.currentTick,
                                selectedEntry.customsCheckCompletedAtTick,
                                selectedEntry.customsCheckStartTick
                            );
                            const remainingTicks = Math.max(
                                0,
                                (selectedEntry.customsCheckCompletedAtTick ?? 0) - (selectedEntry.currentTick ?? 0)
                            );
                            return (
                                <div className="cm-travel-panel">
                                    <div className="cm-travel-header">
                                        <IconAnchor />
                                        <div className="cm-travel-title">Zoll wird überprüft</div>
                                    </div>
                                    <div className="cm-travel-route">{selectedEntry.from} → {selectedEntry.to}</div>
                                    <div className="cm-travel-ticks">
                                        Noch {remainingTicks} {remainingTicks === 1 ? "Tag" : "Tagen"} bis Freigabe
                                    </div>
                                    <StaticProgressBar pct={pct} color="#a0521a" />
                                </div>
                            );
                        })()}

                        {selectedEntry.phase === "blocked" && (() => {
                            const pct = getTickPct(
                                selectedEntry.currentTick,
                                selectedEntry.customsBlockedUntilTick,
                                selectedEntry.customsBlockStartTick
                            );
                            const remainingTicks = Math.max(
                                0,
                                (selectedEntry.customsBlockedUntilTick ?? 0) - (selectedEntry.currentTick ?? 0)
                            );
                            return (
                                <div className="cm-travel-panel">
                                    <div className="cm-travel-header">
                                        <IconWarning />
                                        <div className="cm-travel-title">Schiff festgehalten</div>
                                    </div>
                                    <div className="cm-travel-route">{selectedEntry.from} → {selectedEntry.to}</div>
                                    <div className="cm-travel-ticks">
                                        Noch {remainingTicks} {remainingTicks === 1 ? "Tag" : "Tagen"} bis Freigabe
                                    </div>
                                    <div className="cm-travel-paused" style={{
                                        color: "#b04020",
                                        background: "rgba(176,64,32,0.1)",
                                        border: "1px solid rgba(176,64,32,0.35)",
                                    }}>
                                        <IconWarning />
                                        Zoll-Verzögerung
                                    </div>
                                    <StaticProgressBar pct={pct} color="#b04020" />
                                </div>
                            );
                        })()}

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

                                {selectedEntry.unloadingCompletedAtTick != null && (() => {
                                    const pct = getTickPct(
                                        selectedEntry.currentTick,
                                        selectedEntry.unloadingCompletedAtTick,
                                        selectedEntry.unloadingStartTick
                                    );
                                    return (
                                        <div className="loading-progress-wrap">
                                            <div className="loading-progress-label">Entladevorgang</div>
                                            <StaticProgressBar pct={pct} color="#2196f3" />
                                            <UnloadingStallNotice
                                                currentTick={selectedEntry.currentTick}
                                                completionTick={selectedEntry.unloadingCompletedAtTick}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {selectedEntry.phase === "completed" && (() => {
                            const allRewards = selectedEntry.cargoRewards ?? [];
                            const cargoItems = allRewards.filter(r => r.cargoType !== "SMUGGLE");
                            const smuggleItem = allRewards.find(r => r.cargoType === "SMUGGLE");

                            const customs = selectedEntry.customsSummary;
                            const finePaid = customs?.finePaid ?? 0;
                            const bribePaid = customs?.bribePaid ?? 0;
                            const customsTotalOut = finePaid + bribePaid;

                            const regress = selectedEntry.regressSummary;
                            const regressTotal = regress?.totalFine ?? 0;
                            const regressDelay = regress?.delayComponent ?? 0;
                            const regressDamage = regress?.damageComponent ?? 0;

                            const dockingFine = selectedEntry.dockingFine ?? 0;
                            const departureDockingFine = selectedEntry.departureDockingFine ?? 0;
                            const pilotageRefund = selectedEntry.pilotageRefund ?? 0;
                            const hasDockingPenalty = dockingFine > 0 || departureDockingFine > 0;

                            const cargoBaseTotal = cargoItems.reduce((s, r) => s + (r.actualReward - (r.bonusReward ?? 0)), 0);
                            const bonusTotal = cargoItems.reduce((s, r) => s + (r.bonusReward ?? 0), 0);
                            const smuggleTotal = smuggleItem?.actualReward ?? 0;
                            const ratPenalty = selectedEntry.ratMinigameSummary?.result === "FAILED"
                                ? (selectedEntry.ratMinigameSummary.penaltyAmount ?? 0) : 0;
                            const netTotal = cargoBaseTotal + bonusTotal + smuggleTotal
                                - ratPenalty - customsTotalOut - regressTotal
                                - dockingFine - departureDockingFine + pilotageRefund;

                            const isPerfect = cargoItems.every(r => r.percentage >= 100) && !hasDockingPenalty;

                            return (
                                <div className="cm-reward-panel">
                                    <div className="cm-reward-header">
                                        {isPerfect
                                            ? <IconCheck />
                                            : <IconAnchor />
                                        }
                                        <div className="cm-reward-title">
                                            {isPerfect ? "Perfekte Reise" : "Reise abgeschlossen"}
                                        </div>
                                    </div>


                                    <div className="cm-reward-section-label">
                                        Frachtbilanz ({cargoItems.length + (smuggleItem ? 1 : 0)})
                                    </div>

                                    {cargoItems.map((item, i) => {
                                        const isExpired = item.percentage < 100;
                                        return (
                                            <div key={i} className={`cm-reward-cargo-item${isExpired ? " expired" : ""}`}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="cm-reward-cargo-name">{item.cargoName}</div>
                                                    <div className="cm-reward-cargo-sub">
                                                        {item.destinationPort}{isExpired ? ` (${item.percentage}%)` : ""}
                                                    </div>
                                                </div>
                                                <span className={`cm-reward-cargo-amount${isExpired ? " expired" : ""}`}>
                                                    +{item.actualReward.toLocaleString("de-DE")} T
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {smuggleItem && (
                                        <div className={`cm-reward-cargo-item smuggle${smuggleItem.actualReward === 0 ? " expired" : ""}`}>
                                            <div style={{ flex: 1 }}>
                                                <div className="cm-reward-cargo-name">{smuggleItem.cargoName}</div>
                                                <div className="cm-reward-cargo-sub">
                                                    Schmuggelware{smuggleItem.actualReward === 0 ? " — Konfisziert" : ""}
                                                </div>
                                            </div>
                                            <span className={`cm-reward-cargo-amount${smuggleItem.actualReward === 0 ? " expired" : ""}`}>
                                                +{smuggleItem.actualReward.toLocaleString("de-DE")} T
                                            </span>
                                        </div>
                                    )}

                                    {selectedEntry.ratMinigameSummary?.triggered && selectedEntry.ratMinigameSummary.result === "SUCCESS" && (
                                        <div className="cm-reward-cargo-item">
                                            <div style={{ flex: 1 }}>
                                                <div className="cm-reward-cargo-name">
                                                    <IconCheck />
                                                    Ratten abgewehrt
                                                </div>
                                                <div className="cm-reward-cargo-sub">Ratten-Event</div>
                                            </div>
                                            <span className="cm-reward-cargo-amount">+0 T</span>
                                        </div>
                                    )}

                                    {selectedEntry.ratMinigameSummary?.triggered && selectedEntry.ratMinigameSummary.result === "FAILED" && (
                                        <div className="cm-reward-cargo-item expired">
                                            <div style={{ flex: 1 }}>
                                                <div className="cm-reward-cargo-name">
                                                    <IconWarning />
                                                    Ratten haben Fracht beschädigt
                                                </div>
                                                <div className="cm-reward-cargo-sub">Ratten-Event</div>
                                            </div>
                                            <span className="cm-reward-cargo-amount expired">
                                                -{Math.round(ratPenalty).toLocaleString("de-DE")} T
                                            </span>
                                        </div>
                                    )}

                                    {selectedEntry.stormMinigameSummary?.triggered && selectedEntry.stormMinigameSummary.result === "SUCCESS" && (
                                        <div className="cm-reward-cargo-item">
                                            <div style={{ flex: 1 }}>
                                                <div className="cm-reward-cargo-name">Sturm erfolgreich überstanden</div>
                                                <div className="cm-reward-cargo-sub">Sturm-Event</div>
                                            </div>
                                            <span className="cm-reward-cargo-amount">+0T</span>
                                        </div>
                                    )}

                                    {selectedEntry.stormMinigameSummary?.triggered && selectedEntry.stormMinigameSummary.result === "FAILED" && (
                                        <div className="cm-reward-cargo-item expired">
                                            <div style={{ flex: 1 }}>
                                                <div className="cm-reward-cargo-name">Sturm hat Schiff und Fracht beschaedigt</div>
                                                <div className="cm-reward-cargo-sub">
                                                    {Math.round(selectedEntry.stormMinigameSummary.conditionDamagePercent ?? 0)}% Schiffsschaden,
                                                    {" "}{selectedEntry.stormMinigameSummary.cargoLossPercent ?? 0}% Frachtwert verloren
                                                </div>
                                            </div>
                                            <span className="cm-reward-cargo-amount expired">
                                                -{Math.round(selectedEntry.stormMinigameSummary.penaltyAmount ?? 0).toLocaleString("de-DE")}T
                                            </span>
                                        </div>
                                    )}

                                    <div className="cm-reward-breakdown">
                                        {cargoBaseTotal > 0 && (
                                            <div className="cm-reward-row">
                                                <span>Cargo-Belohnung</span>
                                                <span className="cm-reward-row-value">+{cargoBaseTotal.toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {bonusTotal > 0 && (
                                            <div className="cm-reward-row bonus">
                                                <span>Reisebonus</span>
                                                <span>+{bonusTotal.toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {smuggleTotal > 0 && (
                                            <div className="cm-reward-row bonus">
                                                <span>Mysteriöse Kiste</span>
                                                <span>+{smuggleTotal.toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {ratPenalty > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>Ratten-Strafe</span>
                                                <span>-{Math.round(ratPenalty).toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {bribePaid > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>Bestechung</span>
                                                <span>-{bribePaid.toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {finePaid > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>Zollstrafe</span>
                                                <span>-{finePaid.toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {regress && regress.delayTicks > 0 && regressDelay > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>
                                                    Regress — Verspätung
                                                    <span className="cm-reward-row-sub">
                                                        {" "}({regress.delayTicks} {regress.delayTicks === 1 ? "Tag" : "Tage"} zu spät
                                                        {regress.specialCargoMultiplier > 1
                                                            ? `, ×${regress.specialCargoMultiplier.toFixed(1)} ${regress.hadPerishableCargo ? "verderbliche" : regress.hadFragileCargo ? "zerbrechliche" : "empfindliche"} Ware`
                                                            : ""})
                                                    </span>
                                                </span>
                                                <span>-{Math.round(regressDelay).toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {regressDamage > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>
                                                    Regress — Schaden
                                                    {regress && regress.damagePercent > 0 && (
                                                        <span className="cm-reward-row-sub">
                                                            {" "}({regress.damagePercent.toFixed(1)} % Zustand verloren
                                                            {regress.specialCargoMultiplier > 1
                                                                ? `, ×${regress.specialCargoMultiplier.toFixed(1)}`
                                                                : ""})
                                                        </span>
                                                    )}
                                                </span>
                                                <span>-{Math.round(regressDamage).toLocaleString("de-DE")} T</span>
                                            </div>
                                        )}
                                        {selectedEntry.ratMinigameSummary?.triggered && selectedEntry.ratMinigameSummary.result === "FAILED" && (
                                            <div className="cm-reward-row warn">
                                                <span>⚠ Ratten-Event Schaden</span>
                                                <span className="cm-reward-row-value">
                                                    -{Math.round(selectedEntry.ratMinigameSummary.penaltyAmount ?? 0).toLocaleString("de-DE")}T
                                                </span>
                                            </div>
                                        )}
                                        {selectedEntry.stormMinigameSummary?.triggered && selectedEntry.stormMinigameSummary.result === "FAILED" && (
                                            <div className="cm-reward-row warn">
                                                <span>⚠ Sturm-Event Schaden</span>
                                                <span className="cm-reward-row-value">
                                                    -{Math.round(selectedEntry.stormMinigameSummary.penaltyAmount ?? 0).toLocaleString("de-DE")}T
                                                </span>
                                            </div>
                                        )}
                                        {departureDockingFine > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>⚠ Ablege-Schaden (Kollision)</span>
                                                <span className="cm-reward-row-value">-{departureDockingFine.toLocaleString("de-DE")}T</span>
                                            </div>
                                        )}
                                        {dockingFine > 0 && (
                                            <div className="cm-reward-row warn">
                                                <span>⚠ Anlege-Schaden (Kollision)</span>
                                                <span className="cm-reward-row-value">-{dockingFine.toLocaleString("de-DE")}T</span>
                                            </div>
                                        )}
                                        {pilotageRefund > 0 && (
                                            <div className="cm-reward-row bonus">
                                                <span>Lotsenerstattung (Streik)</span>
                                                <span className="cm-reward-row-value">+{pilotageRefund.toLocaleString("de-DE")}T</span>
                                            </div>
                                        )}
                                        <div className="cm-reward-row total">
                                            <span>Gesamt</span>
                                            <span className="cm-reward-row-value" style={{ color: netTotal < 0 ? "#a0521a" : undefined }}>
                                                {netTotal >= 0 ? "+" : ""}{netTotal.toLocaleString("de-DE")} T
                                            </span>
                                        </div>
                                    </div>

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
                    onComplete={handleDepartureComplete}
                />
            )}

            {showDockingGame && (
                <DockingMiniGame
                    mode="departure"
                    shipIconUrl={showDockingGame.shipIconUrl ?? '/fallback-ship.png'}
                    portName={showDockingGame.from}
                    onSuccess={handleDockingSuccess}
                    onFailure={handleDockingFailure}
                />
            )}
        </div>
    );
}
