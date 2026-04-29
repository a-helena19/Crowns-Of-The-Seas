import { useEffect, useState } from "react";
import "../style/travelNotification.css";

interface CargoRewardBreakdown {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    percentage: number;
    status: "DELIVERED" | "EXPIRED";
    cargoType: string;
}

interface TravelCompleteEvent {
    travelId: string;
    playerId: string;
    cargoRewards: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
}

interface UnloadingState {
    portName: string;
    completedAtTick: number;
    cargoCount: number;
}

interface TravelNotificationProps {
    unloadingState: UnloadingState | null;
    currentTick: number;
    travelResult: TravelCompleteEvent | null;
    onResultDismiss: () => void;
}

const CARGO_ICONS: Record<string, string> = {
    FOOD: "🍎",
    HAZARDOUS: "☢️",
    FRAGILE: "🔨",
    ELECTRONICS: "📱",
    LUXURY_GOODS: "💎",
    GENERAL_GOODS: "📦",
    INDUSTRIAL_GOODS: "⚙️",
};

export default function TravelNotification({
                                               unloadingState,
                                               currentTick,
                                               travelResult,
                                               onResultDismiss,
                                           }: TravelNotificationProps) {
    const [popupOpen, setPopupOpen] = useState(false);

    // Wenn Reise abgeschlossen ist, Pop-up automatisch einmal andeuten (kleiner Bounce)
    const [resultPulse, setResultPulse] = useState(false);
    useEffect(() => {
        if (travelResult) {
            setResultPulse(true);
            const t = setTimeout(() => setResultPulse(false), 2000);
            return () => clearTimeout(t);
        }
    }, [travelResult]);

    if (!unloadingState && !travelResult) return null;

    // Mode: Result hat Vorrang vor Unloading (Reise ist fertig)
    const mode: "unloading" | "result" = travelResult ? "result" : "unloading";

    // Progress für Unloading-Phase
    let progressPct = 0;
    let ticksRemaining = 0;
    if (mode === "unloading" && unloadingState) {
        //const totalTicks = Math.max(1, unloadingState.completedAtTick - currentTick + (unloadingState.completedAtTick - currentTick));
        ticksRemaining = Math.max(0, unloadingState.completedAtTick - currentTick);
        const assumedTotal = Math.max(ticksRemaining + 1, 5);
        progressPct = Math.min(100, ((assumedTotal - ticksRemaining) / assumedTotal) * 100);
    }

    return (
        <>
            <button
                className={`travel-notification ${mode} ${resultPulse ? "pulse" : ""}`}
                onClick={() => setPopupOpen(true)}
                type="button"
            >
                <div className="travel-notif-icon">
                    {mode === "unloading" ? "⚓" : "💰"}
                </div>
                <div className="travel-notif-body">
                    <div className="travel-notif-title">
                        {mode === "unloading"
                            ? "Schiff entlädt"
                            : "Reise abgeschlossen"}
                    </div>
                    <div className="travel-notif-sub">
                        {mode === "unloading"
                            ? `${unloadingState!.portName}`
                            : `+${travelResult!.totalReward.toLocaleString("de")} Gold`}
                    </div>
                    {mode === "unloading" && (
                        <div className="travel-notif-progress">
                            <div
                                className="travel-notif-progress-fill"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    )}
                </div>
                <div className="travel-notif-chevron">›</div>
            </button>

            {/* ── Popup mit Details ── */}
            {popupOpen && (
                <div
                    className="travel-popup-backdrop"
                    onClick={() => setPopupOpen(false)}
                >
                    <div
                        className="travel-popup-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {mode === "unloading" && unloadingState && (
                            <UnloadingDetails
                                portName={unloadingState.portName}
                                ticksRemaining={ticksRemaining}
                                progressPct={progressPct}
                                cargoCount={unloadingState.cargoCount}
                                onClose={() => setPopupOpen(false)}
                            />
                        )}
                        {mode === "result" && travelResult && (
                            <ResultDetails
                                result={travelResult}
                                onClose={() => {
                                    setPopupOpen(false);
                                    onResultDismiss();
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function UnloadingDetails({
                              portName,
                              ticksRemaining,
                              progressPct,
                              cargoCount,
                              onClose,
                          }: {
    portName: string;
    ticksRemaining: number;
    progressPct: number;
    cargoCount: number;
    onClose: () => void;
}) {
    return (
        <>
            <div className="travel-popup-header">
                <h2>⚓ Schiff entlädt Cargo</h2>
                <button className="travel-popup-close" onClick={onClose}>✕</button>
            </div>

            <div className="travel-popup-route">
                Hafen: <strong>{portName}</strong>
            </div>

            <div className="travel-popup-section">
                <div className="travel-popup-label">
                    <span>Entlade-Fortschritt</span>
                    <span>
                        {ticksRemaining > 0
                            ? `${ticksRemaining} Ticks verbleibend`
                            : "Fertig!"}
                    </span>
                </div>
                <div className="travel-popup-progress-track">
                    <div
                        className="travel-popup-progress-fill"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {cargoCount > 0 && (
                <div className="travel-popup-info-row">
                    📦 <span>{cargoCount} Frachtstück{cargoCount !== 1 ? "e" : ""} an Bord</span>
                </div>
            )}

            <div className="travel-popup-footer-info">
                Das Schiff entlädt automatisch und ist danach wieder bereit für neue Reisen.
            </div>
        </>
    );
}

function ResultDetails({
                           result,
                           onClose,
                       }: {
    result: TravelCompleteEvent;
    onClose: () => void;
}) {
    const [displayedBalance, setDisplayedBalance] = useState(result.previousBalance);
    const balanceGain = result.newBalance - result.previousBalance;

    useEffect(() => {
        const duration = 1500;
        const steps = 40;
        const increment = balanceGain / steps;
        let count = 0;
        const id = setInterval(() => {
            count++;
            setDisplayedBalance(Math.floor(result.previousBalance + increment * count));
            if (count >= steps) {
                clearInterval(id);
                setDisplayedBalance(result.newBalance);
            }
        }, duration / steps);
        return () => clearInterval(id);
    }, [result.previousBalance, result.newBalance, balanceGain]);

    const sortedCargos = [...result.cargoRewards].sort((a, b) =>
        a.status === b.status ? 0 : a.status === "DELIVERED" ? -1 : 1
    );
    const deliveredCount = sortedCargos.filter(c => c.status === "DELIVERED").length;
    const expiredCount = sortedCargos.filter(c => c.status === "EXPIRED").length;
    const isPerfect = expiredCount === 0 && deliveredCount > 0;

    return (
        <>
            <div className="travel-popup-header">
                <h2>{isPerfect ? "🌟 Perfekte Reise!" : "⚓ Reise abgeschlossen"}</h2>
                <button className="travel-popup-close" onClick={onClose}>✕</button>
            </div>

            {isPerfect && (
                <div className="travel-popup-perfect-banner">
                    100% Lieferquote — alle Frachten erfolgreich abgeliefert!
                </div>
            )}

            {/* Frachtbilanz */}
            <div className="travel-popup-section">
                <div className="travel-popup-section-title">
                    Frachtbilanz ({result.cargoRewards.length})
                </div>
                <div className="travel-popup-cargo-list">
                    {sortedCargos.map(cargo => (
                        <div
                            key={cargo.cargoId}
                            className={`travel-popup-cargo-item ${cargo.status.toLowerCase()}`}
                        >
                            <span className="travel-popup-cargo-icon">
                                {CARGO_ICONS[cargo.cargoType] ?? "📦"}
                            </span>
                            <div className="travel-popup-cargo-info">
                                <div className="travel-popup-cargo-name">
                                    {cargo.cargoName}
                                </div>
                                <div className="travel-popup-cargo-port">
                                    → {cargo.destinationPort}
                                </div>
                            </div>
                            <div className="travel-popup-cargo-reward">
                                {cargo.status === "EXPIRED" && (
                                    <span className="travel-popup-cargo-percent">
                                        ({cargo.percentage}%)
                                    </span>
                                )}
                                <span className={`travel-popup-cargo-amount ${cargo.status.toLowerCase()}`}>
                                    +{cargo.actualReward.toLocaleString("de")}G
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Belohnung-Zusammenfassung */}
            <div className="travel-popup-summary">
                {result.cargoRewards.length > 0 && (
                    <div className="travel-popup-summary-row">
                        <span>Cargo Belohnung</span>
                        <span>
                            +{result.cargoRewards
                            .reduce((sum, c) => sum + c.actualReward, 0)
                            .toLocaleString("de")}G
                        </span>
                    </div>
                )}
                {result.baseReward > 0 && (
                    <div className="travel-popup-summary-row bonus">
                        <span>🎁 Reise Bonus</span>
                        <span>+{result.baseReward.toLocaleString("de")}G</span>
                    </div>
                )}
                <div className="travel-popup-summary-divider" />
                <div className="travel-popup-summary-row total">
                    <span>Gesamt</span>
                    <span>+{result.totalReward.toLocaleString("de")}G</span>
                </div>
            </div>

            {/* Kontostand */}
            <div className="travel-popup-balance">
                <div className="travel-popup-balance-row">
                    <span>Vorher</span>
                    <span>{result.previousBalance.toLocaleString("de")}G</span>
                </div>
                <div className="travel-popup-balance-row gain">
                    <span>+</span>
                    <span>+{balanceGain.toLocaleString("de")}G</span>
                </div>
                <div className="travel-popup-balance-row new">
                    <span>Neuer Kontostand</span>
                    <span>{displayedBalance.toLocaleString("de")}G</span>
                </div>
            </div>

            <button className="travel-popup-confirm" onClick={onClose}>
                Weiter
            </button>
        </>
    );
}