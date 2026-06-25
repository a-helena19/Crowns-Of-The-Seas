import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import audioEngine from "../audio/AudioEngine";
import "../style/interactiveTutorial.css";

type TutorialMode = "prompt" | "tour" | "closed";

interface TutorialStep {
    id: string;
    target: string;
    title: string;
    body: string;
    nextLabel?: string;
    waitBody?: string;
    clickTarget?: boolean;
}

interface InteractiveTutorialProps {
    playerId: string | null;
}

const STORAGE_PREFIX = "crowns_tutorial_seen_v1";
const RESTART_EVENT = "crowns:start-tutorial";

const STEPS: TutorialStep[] = [
    {
        id: "ship-market",
        target: "open-ship-market",
        title: "Schiffsmarkt öffnen",
        body: "Hier kaufst du dein erstes Schiff. Klicke auf den Schiffsmarkt, dann suchen wir gemeinsam ein passendes Schiff aus.",
        nextLabel: "Klicken und weiter",
    },
    {
        id: "buy-ship",
        target: "buy-ship",
        title: "Schiff kaufen",
        body: "Wähle ein bezahlbares Schiff und klicke auf Kaufen. Danach schließen wir den Markt und wählen dein neues Schiff aus.",
        waitBody: "Der Schiffsmarkt lädt noch oder es gibt gerade kein kaufbares Schiff. Sobald ein Kaufbutton sichtbar ist, geht es weiter.",
        nextLabel: "Kaufen und weiter",
    },
    {
        id: "close-ship-market",
        target: "close-ship-market",
        title: "Zur Karte zurück",
        body: "Das Schiff ist gekauft. Schließe jetzt den Schiffsmarkt, damit du es unten in deiner Schiffsliste auswählen kannst.",
        waitBody: "Warte kurz, bis der Kauf abgeschlossen ist. Danach geht es zurück zur Karte.",
        nextLabel: "Markt schließen",
    },
    {
        id: "ship-card",
        target: "ship-card",
        title: "Schiff auswählen",
        body: "Deine Schiffe findest du unten. Klicke dein Schiff an, um am aktuellen Hafen Fracht auszuwählen.",
        waitBody: "Sobald dein gekauftes Schiff unten erscheint, kannst du es hier auswählen.",
        nextLabel: "Schiff auswählen",
    },
    {
        id: "cargo-offer",
        target: "cargo-offer",
        title: "Fracht auswählen",
        body: "Links stehen die verfügbaren Frachten am Hafen. Wähle ein Angebot aus, um Route, Risiko, Belohnung und Treibstoff zu prüfen.",
        waitBody: "Die Frachtbörse lädt noch. Wenn am Hafen Frachten verfügbar sind, markieren wir das erste Angebot.",
        nextLabel: "Fracht wählen",
    },
    {
        id: "speed-settings",
        target: "speed-settings",
        title: "Route und Tempo prüfen",
        body: "Hier siehst du, wie weit die Reise ist und wie viel Treibstoff die gewählte Geschwindigkeit kostet. Schneller ist nicht immer besser, wenn der Tank knapp wird.",
        waitBody: "Die Routen- und Treibstoffdaten werden noch berechnet. Gleich siehst du, welche Geschwindigkeit möglich ist.",
        nextLabel: "Weiter",
        clickTarget: false,
    },
    {
        id: "accept-cargo",
        target: "accept-cargo",
        title: "Fracht annehmen",
        body: "Mit diesem Button reservierst du die Fracht für dein Schiff. Danach wird sie beladen und erscheint in der Auftragsverwaltung.",
        nextLabel: "Fracht annehmen",
    },
    {
        id: "orders",
        target: "orders",
        title: "Aufträge öffnen",
        body: "Nach dem Annehmen wird die Fracht geladen. In den Aufträgen siehst du den Ladefortschritt und startest anschließend die Reise.",
        nextLabel: "Aufträge öffnen",
    },
    {
        id: "start-travel",
        target: "start-travel",
        title: "Reise starten",
        body: "Wenn die Fracht bereit ist, startest du hier die erste Reise. Minigames erklären wir in diesem Tutorial nicht; die erscheinen später als eigene Ereignisse.",
        waitBody: "Die Fracht wird noch vorbereitet. Sobald die Reise bereit ist, markieren wir den Startbutton.",
        nextLabel: "Reise starten",
        clickTarget: false,
    },
];

function storageKey(playerId: string | null): string {
    return `${STORAGE_PREFIX}:${playerId ?? "guest"}`;
}

function findTarget(selectorName: string): HTMLElement | null {
    const enabled = document.querySelector<HTMLElement>(`[data-tutorial="${selectorName}"]:not(:disabled)`);
    return enabled ?? document.querySelector<HTMLElement>(`[data-tutorial="${selectorName}"]`);
}

export function requestTutorialRestart() {
    window.dispatchEvent(new Event(RESTART_EVENT));
}

export default function InteractiveTutorial({ playerId }: InteractiveTutorialProps) {
    const [mode, setMode] = useState<TutorialMode>("closed");
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [targetAvailable, setTargetAvailable] = useState(false);
    const key = useMemo(() => storageKey(playerId), [playerId]);

    const closeAndRemember = useCallback(() => {
        localStorage.setItem(key, "true");
        setMode("closed");
    }, [key]);

    const startTour = useCallback((fromHelpCenter = false) => {
        if (!fromHelpCenter) {
            localStorage.setItem(key, "true");
        }
        setStepIndex(0);
        setMode("tour");
    }, [key]);

    useEffect(() => {
        if (localStorage.getItem(key) === "true") return;
        const id = window.setTimeout(() => setMode("prompt"), 650);
        return () => window.clearTimeout(id);
    }, [key]);

    useEffect(() => {
        const restart = () => startTour(true);
        window.addEventListener(RESTART_EVENT, restart);
        return () => window.removeEventListener(RESTART_EVENT, restart);
    }, [startTour]);

    useEffect(() => {
        if (mode !== "tour") return;
        const step = STEPS[stepIndex];
        const updateTarget = () => {
            const target = findTarget(step.target);
            setTargetAvailable(Boolean(target && !(target as HTMLButtonElement).disabled));
            setTargetRect(target?.getBoundingClientRect() ?? null);
            target?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        };
        updateTarget();
        const interval = window.setInterval(updateTarget, 300);
        window.addEventListener("resize", updateTarget);
        window.addEventListener("scroll", updateTarget, true);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("resize", updateTarget);
            window.removeEventListener("scroll", updateTarget, true);
        };
    }, [mode, stepIndex]);

    if (mode === "closed") return null;

    const finish = () => {
        audioEngine.playSfx("buttonClick");
        closeAndRemember();
    };

    const prompt = (
        <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-label="Tutorial starten">
            <div className="tutorial-prompt">
                <div className="tutorial-kicker">Erste Fahrt</div>
                <h2>Möchtest du ein kurzes Tutorial?</h2>
                <p>
                    Wir führen dich einmal durch die wichtigsten Schritte: Schiff kaufen,
                    auswählen, Fracht laden und die erste Reise starten.
                </p>
                <div className="tutorial-actions">
                    <button type="button" className="tutorial-btn secondary" onClick={() => { audioEngine.playSfx("buttonClick"); closeAndRemember(); }}>
                        Nein, überspringen
                    </button>
                    <button type="button" className="tutorial-btn primary" onClick={() => { audioEngine.playSfx("buttonClick"); startTour(); }}>
                        Ja, Tutorial starten
                    </button>
                </div>
            </div>
        </div>
    );

    if (mode === "prompt") {
        return createPortal(prompt, document.body);
    }

    const step = STEPS[stepIndex];
    const isLast = stepIndex === STEPS.length - 1;
    const rectStyle = targetRect
        ? {
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
        }
        : undefined;
    const cardStyle = targetRect
        ? {
            left: Math.min(Math.max(18, targetRect.left), window.innerWidth - 380),
            top: targetRect.bottom + 18 < window.innerHeight - 190
                ? targetRect.bottom + 18
                : Math.max(18, targetRect.top - 210),
        }
        : undefined;

    const goNext = () => {
        const target = findTarget(step.target);
        if (targetAvailable && target && step.clickTarget !== false) {
            audioEngine.playSfx("buttonClick");
            target.click();
        }
        if (isLast) {
            closeAndRemember();
            return;
        }
        setStepIndex(i => i + 1);
    };

    const tour = (
        <div className="tutorial-layer" aria-live="polite">
            <div className="tutorial-dim" />
            {targetRect && <div className="tutorial-spotlight" style={rectStyle} />}
            <div className="tutorial-card" style={cardStyle}>
                <div className="tutorial-progress">Schritt {stepIndex + 1} von {STEPS.length}</div>
                <h2>{step.title}</h2>
                <p>{targetAvailable ? step.body : (step.waitBody ?? step.body)}</p>
                <div className="tutorial-actions">
                    <button type="button" className="tutorial-btn secondary" onClick={finish}>
                        Tutorial beenden
                    </button>
                    <button type="button" className="tutorial-btn primary" onClick={goNext} disabled={!targetAvailable && !isLast}>
                        {isLast ? "Abschließen" : step.nextLabel ?? "Weiter"}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(tour, document.body);
}
