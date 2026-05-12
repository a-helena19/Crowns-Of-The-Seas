import type { LeaderboardEntry } from "../types/leaderboard";

export async function getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
    const token = localStorage.getItem("auth_token") ?? "";
    const res = await fetch(`/api/leaderboard?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error(`Leaderboard load failed: ${res.status}`);
    }
    return res.json();
}
