import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboardApi";
import type { LeaderboardEntry } from "../types/leaderboard";
import "../style/gameOver.css";

interface Props {
    sessionId: string;
    currentUserId: string | null;
}

/* ── Konfetti — helle Farben für dunklen Himmel ── */
const CONFETTI_COLORS = [
    "#fdf0d5", "#c89b3c", "#f6d365", "#ffd060",
    "#e8c97a", "#ff922b", "#51cf66", "#cc5de8",
];
const SHAPES = ["square", "circle", "diamond"] as const;

function generateParticles(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 3 + 1.5,
        duration: 2 + Math.random() * 3,
        size: 4 + Math.random() * 6,
    }));
}

/* ── Sterne (wie Intro) ── */
function generateStars(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 50,
        delay: Math.random() * 2,
    }));
}

/* ── Count-Up Hook ── */
function useCountUp(target: number, duration: number, startDelay: number) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const startTime = performance.now();
            const step = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / (duration * 1000), 1);
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                setValue(Math.round(target * eased));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, startDelay * 1000);

        return () => clearTimeout(timeout);
    }, [target, duration, startDelay]);

    return value;
}

/* ── CountUpCell ── */
function CountUpCell({ value, delay, suffix = "" }: {
    value: number; delay: number; suffix?: string
}) {
    const animated = useCountUp(value, 1.2, delay);
    return (
        <span className="count-up">
            {animated.toLocaleString("de-DE")}{suffix}
        </span>
    );
}

export default function GameOverScreen({ sessionId, currentUserId }: Props) {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const hasLoadedRef = useRef(false);

    const particles = useMemo(() => generateParticles(60), []);
    const stars = useMemo(() => generateStars(25), []);

    const loadLeaderboard = useCallback(async () => {
        if (hasLoadedRef.current) return;
        try {
            const data = await getLeaderboard(sessionId);
            setEntries(data);
            setLoaded(true);
            hasLoadedRef.current = true;
        } catch (err) {
            console.error("GameOver: Leaderboard laden fehlgeschlagen", err);
        }
    }, [sessionId]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const winner = entries.length > 0 ? entries[0] : null;

    // Podest: [Platz 2, Platz 1, Platz 3]
    const podiumOrder = useMemo(() => {
        if (entries.length === 0) return [];
        const slots: (LeaderboardEntry | null)[] = [
            entries[1] ?? null,
            entries[0],
            entries[2] ?? null,
        ];
        return slots.filter(Boolean) as LeaderboardEntry[];
    }, [entries]);

    function podiumRank(index: number, total: number): number {
        if (total === 1) return 1;
        if (total === 2) return index === 0 ? 2 : 1;
        return [2, 1, 3][index];
    }

    function handleBackToLobby() {
        sessionStorage.removeItem("currentSession");
        navigate("/lobby");
    }

    if (!loaded) {
        return (
            <div className="gameover-overlay">
                <div className="gameover-moon" />
                <div className="gameover-rays" />
                <div className="gameover-title-section">
                    <div className="gameover-subtitle">Berechne Ergebnis...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="gameover-overlay">
            {/* Mond */}
            <div className="gameover-moon" />

            {/* Strahlen vom Mond */}
            <div className="gameover-rays" />

            {/* Sterne */}
            {stars.map(s => (
                <div
                    key={s.id}
                    className="gameover-star"
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        animationDelay: `${s.delay}s`,
                    }}
                />
            ))}

            {/* Konfetti */}
            <div className="gameover-particles">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className={`gameover-particle ${p.shape}`}
                        style={{
                            left: `${p.left}%`,
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* Titel */}
            <div className="gameover-title-section">
                <div className="gameover-subtitle">Die Zeit ist abgelaufen</div>
                <h1 className="gameover-title">Spielende</h1>
            </div>

            {/* Gewinner */}
            {winner && (
                <div className="gameover-winner-announce">
                    <span className="gameover-crown-icon">👑</span>
                    <div className="gameover-winner-name">{winner.playerName}</div>
                    <div className="gameover-winner-label">Herrscher der Meere</div>
                </div>
            )}

            {/* Podest */}
            <div className="gameover-podium">
                {podiumOrder.map((entry, i) => {
                    const rank = podiumRank(i, podiumOrder.length);
                    return (
                        <div
                            key={entry.playerId}
                            className="gameover-podium-slot"
                            data-rank={rank}
                        >
                            <div className="podium-player-name">{entry.playerName}</div>
                            <div className="podium-player-value">
                                <CountUpCell
                                    value={Math.round(entry.totalValue)}
                                    delay={rank === 3 ? 1.0 : rank === 2 ? 1.4 : 1.8}
                                    suffix=" T"
                                />
                            </div>
                            <div className="podium-block" data-rank={rank}>
                                #{rank}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Statistik */}
            <div className="gameover-stats">
                <div className="gameover-stats-title">Statistiken</div>
                <table className="gameover-stats-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th style={{ textAlign: "left" }}>Spieler</th>
                        <th>Schiffe</th>
                        <th>Bargeld</th>
                        <th>Schiffswert</th>
                        <th>Gesamt</th>
                    </tr>
                    </thead>
                    <tbody>
                    {entries.map(e => {
                        const isMe = currentUserId === e.playerId;
                        const rankClass =
                            e.rank === 1 ? "stats-rank-1" :
                                e.rank === 2 ? "stats-rank-2" :
                                    e.rank === 3 ? "stats-rank-3" : "";
                        return (
                            <tr key={e.playerId} className={isMe ? "is-me" : ""}>
                                <td>
                                        <span className={`stats-rank ${rankClass}`}>
                                            #{e.rank}
                                        </span>
                                </td>
                                <td style={{ textAlign: "left" }}>
                                        <span className="stats-name">
                                            {e.playerName}{isMe ? " (Du)" : ""}
                                        </span>
                                </td>
                                <td>
                                    <CountUpCell value={e.shipCount} delay={2.6} suffix=" ⛵" />
                                </td>
                                <td>
                                        <span className="stats-value-gold">
                                            <CountUpCell value={Math.round(e.cash)} delay={2.6} suffix=" T" />
                                        </span>
                                </td>
                                <td>
                                    <CountUpCell value={Math.round(e.shipsValue)} delay={2.6} suffix=" T" />
                                </td>
                                <td>
                                        <span className="stats-value-total">
                                            <CountUpCell value={Math.round(e.totalValue)} delay={2.6} suffix=" T" />
                                        </span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Button */}
            <div className="gameover-actions">
                <button className="gameover-btn" onClick={handleBackToLobby}>
                    Zurück zur Lobby
                </button>
            </div>
        </div>
    );
}