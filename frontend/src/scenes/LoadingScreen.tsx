import "../style/loading.css";

interface PlayerShip {
    id: string;
    name: string;
    maxCargoCapacity?: number;
    iconUrl?: string;
}

interface Cargo {
    from: string;
    to: string;
    weight: number;
}

interface LoadingScreenProps {
    ship: PlayerShip;
    cargo: Cargo;
    done: boolean;
    onComplete: () => void;
    loadingDurationSeconds?: number;
    elapsedRatio?: number;
}

export default function LoadingScreen({
                                          ship,
                                          cargo,
                                          done,
                                          onComplete,
                                          loadingDurationSeconds = 10,
                                          elapsedRatio,
                                      }: LoadingScreenProps) {

    // ─────────────────────────────────────────────────────────────────
    // Wenn der Parent uns einen `elapsedRatio` gibt, nutzen wir den.
    // Damit:
    //  - startet der Balken nach Re-Mount nicht bei 0%
    //  - läuft er korrekt weiter, weil der Parent alle 100ms neu rendert
    //  - ist `done` ableitbar aus elapsedRatio >= 1
    //
    // `onComplete` rufen wir hier NICHT mehr auf, weil der Parent
    // (CargoManagementScreen) bzw. der GameScreen-Hintergrund-Ticker das
    // ohnehin übernimmt — selbst wenn wir gar nicht gemounted sind.
    // ─────────────────────────────────────────────────────────────────

    const useExternalProgress = typeof elapsedRatio === "number";
    const pct = useExternalProgress
        ? Math.min(100, Math.max(0, elapsedRatio! * 100))
        : 0; // Fallback wird unten als CSS-Animation gerendert

    const maxCap = ship.maxCargoCapacity ?? 0;
    const fillPct = maxCap > 0 ? Math.min((cargo.weight / maxCap) * 100, 100) : 100;

    // Falls kein elapsedRatio gegeben ist, behalten wir den alten
    // CSS-Animations-Pfad bei (für Aufrufer die nicht migriert wurden).
    const animationDuration = loadingDurationSeconds || 10;

    return (
        <div className="loading-panel">
            <div className="loading-title">
                {done ? "Schiff beladen" : (
                    <>
                        Schiff wird beladen
                        <span className="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </>
                )}
            </div>

            {!done && (
                <div className="loading-ship-wrap">
                    <span className="cargo-box">📦</span>
                    <span className="cargo-box">📦</span>
                    <span className="cargo-box">📦</span>
                    <img
                        src={ship.iconUrl ?? "/fallback-ship.png"}
                        alt={ship.name}
                        className="loading-ship-img"
                        onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                    />
                </div>
            )}

            {done && (
                <div className="loading-done">
                    <div className="loading-done-icon">✅</div>
                    <div className="loading-done-text">Beladen abgeschlossen!</div>
                    <div className="loading-done-sub">{cargo.weight}t geladen — bereit zur Abfahrt</div>
                </div>
            )}

            <div className="loading-route">
                {cargo.from} → {cargo.to}
            </div>

            <div className="loading-capacity">
                <div className="loading-capacity-label">
                    <span>Ladekapazität</span>
                    <span>{cargo.weight}t / {maxCap > 0 ? `${maxCap}t` : "–"}</span>
                </div>
                <div className="capacity-track">
                    <div
                        className="capacity-fill ok"
                        style={{ width: `${fillPct}%` }}
                    />
                </div>
            </div>

            <div className="loading-progress-wrap">
                <div className="loading-progress-label">Beladevorgang</div>
                <div className="progress-track">
                    {done && (
                        <div className="progress-fill-done" />
                    )}
                    {!done && useExternalProgress && (
                        <div
                            className="progress-fill"
                            style={{
                                // Berechneter Wert vom Parent. Keine CSS-Animation,
                                // keine Transition — der Parent rendert alle 100ms
                                // neu und liefert sofort den korrekten Stand.
                                width: `${pct}%`,
                                animation: "shimmer 1.5s linear infinite",
                                transition: "none",
                            }}
                        />
                    )}
                    {!done && !useExternalProgress && (
                        <div
                            className="progress-fill"
                            style={{
                                animation: `progressFill ${animationDuration}s linear forwards, shimmer 1.5s linear infinite`,
                            }}
                            onAnimationEnd={onComplete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}