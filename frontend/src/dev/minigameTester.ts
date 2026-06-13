// =============================================================================
//  DEV / PRÄSENTATIONS-TOOL  –  NICHT Teil der Spiel-Logik
// -----------------------------------------------------------------------------
//  Blendet ein Minigame zum Testen/Vorführen direkt ein, ohne Backend, ohne
//  Reise und ohne die Spawn-Wahrscheinlichkeit zu verändern. Aufruf in der
//  Browser-Konsole, z. B.:
//
//      miniGame("Rat")        // Ratten
//      miniGame("Storm")      // Sturm
//      miniGame("Obstacle")   // Gefährliche Passage  (optional: miniGame("Obstacle","VIEW_B"))
//      miniGame("Treasure")   // Schatzsuche
//      miniGame()             // listet die Optionen auf
//
//  Es wird lediglich derselbe React-State gesetzt, den auch ein echtes Event
//  setzen würde – das Overlay erscheint, ist voll spielbar, und räumt sich nach
//  dem Abschluss normal wieder auf (der Ergebnis-POST ans Backend schlägt für
//  das Fake-Event fehl, wird aber – wie im Spiel – stillschweigend verschluckt).
// =============================================================================

import type { RatMinigameEventPayload } from "../minigame/rats/RatMinigameTypes";
import type { StormMinigameEventPayload } from "../minigame/storm/StormMinigameTypes";
import type {
    ObstacleMinigameEventPayload,
    ObstacleRouteViewType,
} from "../minigame/obstacle/ObstacleMinigameTypes";
import type { TreasureHuntMinigameEventPayload } from "../minigame/treasureHunt/TreasureHuntMinigameTypes";
import audioEngine from "../audio/AudioEngine.ts";

interface MinigameTesterApi {
    playerId: string;
    sessionId: string;
    setRat: (payload: RatMinigameEventPayload | null) => void;
    setStorm: (payload: StormMinigameEventPayload | null) => void;
    setObstacle: (payload: ObstacleMinigameEventPayload | null) => void;
    setTreasure: (payload: TreasureHuntMinigameEventPayload | null) => void;
}

function makeId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

// Mappt diverse Schreibweisen auf einen kanonischen Typ.
function normalizeType(raw: string): "RATS" | "STORM" | "OBSTACLE" | "TREASURE_HUNT" | null {
    const t = raw.trim().toLowerCase();
    if (["rat", "rats", "ratte", "ratten"].includes(t)) return "RATS";
    if (["storm", "sturm"].includes(t)) return "STORM";
    if (["obstacle", "passage", "wrack", "wreck", "hindernis"].includes(t)) return "OBSTACLE";
    if (["treasure", "treasurehunt", "treasure_hunt", "schatz", "schatzsuche"].includes(t)) return "TREASURE_HUNT";
    return null;
}

/**
 * Fängt NUR die Ergebnis-POSTs von Test-Minigames ab (erkennbar an der
 * `test-`-travelId im Body) und gibt eine Fake-200-Antwort zurück, damit das
 * Backend nicht mit einem nicht existierenden Event aufgerufen wird (sonst
 * 500/4xx, das der Browser rot in die Konsole schreibt). Echte Minigames
 * (UUID-travelId) laufen unverändert durch.
 */
function installTestResultInterceptor(): () => void {
    const originalFetch = window.fetch.bind(window);

    const patched: typeof window.fetch = (input, init) => {
        try {
            const url =
                typeof input === "string" ? input :
                    input instanceof URL ? input.href :
                        (input as Request).url;
            const isMinigameResult = url.includes("/api/minigames/") && url.includes("/result");
            const body = init?.body;
            if (isMinigameResult && typeof body === "string" && body.includes('"travelId":"test-')) {
                return Promise.resolve(
                    new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
                );
            }
        } catch {
            // Im Zweifel ganz normal weiterleiten.
        }
        return originalFetch(input as RequestInfo, init);
    };

    window.fetch = patched;
    return () => {
        if (window.fetch === patched) {
            window.fetch = originalFetch;
        }
    };
}

/**
 * Registriert window.miniGame(...) und gibt eine Cleanup-Funktion zurück.
 */
export function registerMinigameTester(api: MinigameTesterApi): () => void {
    const { playerId, sessionId, setRat, setStorm, setObstacle, setTreasure } = api;

    const removeInterceptor = installTestResultInterceptor();

    const STOP_WORDS = ["stop", "stopp", "close", "schließen", "schliessen", "off", "aus", "none", "x"];

    const clearAll = () => {
        setRat(null);
        setStorm(null);
        setObstacle(null);
        setTreasure(null);
    };

    const miniGame = (type?: string, routeView?: ObstacleRouteViewType) => {
        if (!type) {
            // eslint-disable-next-line no-console
            console.info(
                "%cMinigame-Tester%c  miniGame(\"Rat\" | \"Storm\" | \"Obstacle\" | \"Treasure\")\n" +
                "  Schließen:           miniGame(\"stop\")\n" +
                "  Obstacle-Ansicht:    miniGame(\"Obstacle\", \"VIEW_B\")",
                "font-weight:bold;color:#c8a040", "color:inherit",
            );
            return;
        }

        // "stop"/"close" -> alle offenen Test-Minigames schließen.
        if (STOP_WORDS.includes(type.trim().toLowerCase())) {
            clearAll();
            audioEngine.stopMusic();
            audioEngine.playMusic("game");
            return;
        }

        const kind = normalizeType(type);
        if (!kind) {
            return;
        }

        // Echtes Schiff-Icon des Spielers, falls vorhanden (nur Optik).
        const ship = window.__latestShips?.find((s) => s.playerId === playerId);
        const shipIconUrl = ship?.iconUrl;
        const playerShipId = ship?.playerShipId ?? "test-ship";

        const base = {
            eventId: makeId(),
            playerId,
            sessionId,
            travelId: `test-${makeId()}`,
            playerShipId,
        };

        const start = () => {
            switch (kind) {
                case "RATS":
                    setRat({ ...base, eventType: "RATS", timeLimitSeconds: 30, requiredHits: 10 });
                    break;
                case "STORM":
                    setStorm({
                        ...base, eventType: "STORM",
                        timeLimitSeconds: 30, requiredSuns: 8, startHealth: 100, shipIconUrl,
                    });
                    break;
                case "OBSTACLE":
                    setObstacle({
                        ...base, eventType: "OBSTACLE",
                        timeLimitSeconds: 30, startHealth: 100,
                        routeViewType: routeView ?? "VIEW_A", shipIconUrl,
                    });
                    break;
                case "TREASURE_HUNT":
                    setTreasure({
                        ...base, eventType: "TREASURE_HUNT",
                        timeLimitSeconds: 30, requiredTreasures: 5, pirateCount: 3, shipIconUrl,
                    });
                    break;
            }
        };

        // Erst ein evtl. laufendes Test-Minigame schließen (unmount + Phaser-destroy,
        // stoppt auch dessen Sound), dann im nächsten Tick das neue starten.
        clearAll();
        setTimeout(start, 0);
    };

    window.miniGame = miniGame;

    return () => {
        removeInterceptor();
        if (window.miniGame === miniGame) {
            delete window.miniGame;
        }
    };
}