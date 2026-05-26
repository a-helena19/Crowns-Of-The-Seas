import { useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../api/leaderboardApi";
import type { LeaderboardEntry } from "../types/leaderboard";
import "../style/leaderboardOverlay.css";

type Props = {
    sessionId: string;
    currentUserId: string | null;
};

export default function LeaderboardOverlay({ sessionId, currentUserId }: Props) {
    const [open, setOpen] = useState(true);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const data = await getLeaderboard(sessionId);
            setEntries(data);
        } catch {
            setError("Rangliste konnte nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!sessionId) return;
        load();
        const id = window.setInterval(load, 5000);
        return () => window.clearInterval(id);
    }, [sessionId]);

    const sorted = useMemo(() => entries, [entries]);

    return (
        <div className={`lb-overlay ${open ? "open" : "closed"}`}>
            <button className="lb-toggle" onClick={() => setOpen(v => !v)}>
                {open ? "Rangliste ▾" : "Rangliste ▸"}
            </button>

            {open && (
                <div className="lb-panel">
                    {loading && <div className="lb-state">Lade…</div>}
                    {error && <div className="lb-state lb-error">{error}</div>}

                    {!loading && !error && (
                        <ul className="lb-list">
                            {sorted.map((e) => {
                                const isMe = currentUserId === e.playerId;
                                return (
                                    <li key={e.playerId} className={`lb-row ${isMe ? "me" : ""}`}>
                                        <span className="lb-rank">#{e.rank}</span>
                                        <span className="lb-name">{e.playerName}</span>
                                        <span className="lb-total">{Math.round(e.totalValue).toLocaleString("de-DE")} T</span>

                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
