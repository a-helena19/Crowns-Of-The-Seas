import { useEffect, useRef } from "react";
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
}

export default function LoadingScreen({ ship, cargo, done, onComplete,
                                          loadingDurationSeconds = 10
                                      }: LoadingScreenProps) {
    const progressRef = useRef<HTMLDivElement>(null);

    const animationDuration = loadingDurationSeconds || 10;

    useEffect(() => {
        if (done) return;
        const el = progressRef.current;
        if (!el) return;
        const onEnd = () => onComplete();
        el.addEventListener('animationend', onEnd, { once: true });
        // Fallback in case animationend doesn't fire
        const fallback = setTimeout(onComplete, animationDuration * 1000);

        return () => {
            el.removeEventListener('animationend', onEnd);
            clearTimeout(fallback);
        };
    }, [done, onComplete, animationDuration]);

    const maxCap = ship.maxCargoCapacity ?? 0;
    const fillPct = maxCap > 0 ? Math.min((cargo.weight / maxCap) * 100, 100) : 100;

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
                    {done
                        ? <div className="progress-fill-done" />
                        : <div className="progress-fill" ref={progressRef} style={{
                            animation: `progressFill ${animationDuration}s linear forwards, shimmer 1.5s linear infinite`
                        }}/>
                    }
                </div>
            </div>
        </div>
    );
}
