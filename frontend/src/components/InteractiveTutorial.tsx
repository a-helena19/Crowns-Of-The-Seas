import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import audioEngine from "../audio/AudioEngine";
import "../style/interactiveTutorial.css";

type TutorialMode = "prompt" | "tour" | "closed";
export type TutorialChapterId =
    | "firstJourney"
    | "emptyVoyage"
    | "postTravel"
    | "service"
    | "luxuryFreight";

interface TutorialStep {
    id: string;
    target?: string;
    targetSelector?: string;
    title: string;
    body: string;
    nextLabel?: string;
    waitBody?: string;
    clickTarget?: boolean;
    clickSelector?: string;
    allowDisabled?: boolean;
    hideActionsWhenWaiting?: boolean;
    fallbackTarget?: string;
    autoAdvanceOnTargetLoss?: boolean;
    freezeHighlight?: boolean;
}

interface TutorialChapter {
    id: TutorialChapterId;
    kicker: string;
    promptTitle: string;
    promptBody: string;
    steps: TutorialStep[];
}

interface InteractiveTutorialProps {
    playerId: string | null;
}

interface TutorialPromptNotice {
    title: string;
    body: string;
}

interface TutorialViewportSize {
    width: number;
    height: number;
}

const STORAGE_PREFIX = "crowns_tutorial_seen_v2";
const LEGACY_FIRST_JOURNEY_STORAGE_PREFIX = "crowns_tutorial_seen_v1";
const RESTART_EVENT = "crowns:start-tutorial";

const TUTORIAL_CHAPTERS: Record<TutorialChapterId, TutorialChapter> = {
    firstJourney: {
        id: "firstJourney",
        kicker: "Erste Fahrt",
        promptTitle: "Möchtest du ein kurzes Tutorial?",
        promptBody: "Wir zeigen dir zuerst kurz das Spielfeld und danach die wichtigsten Schritte: Schiff kaufen, auswählen, Fracht laden und die erste Reise starten.",
        steps: [
            {
                id: "hud-balance",
                target: "hud-balance",
                title: "Dein Geld",
                body: "Hier siehst du jederzeit, wie viele Taler du gerade zur Verfügung hast. Damit kaufst du Schiffe, tankst und bezahlst optionale Dienste.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-ships",
                target: "hud-ships",
                title: "Deine Flotte",
                body: "Daneben siehst du, wie viele Schiffe du aktuell besitzt. Mehr Schiffe bedeuten mehr gleichzeitige Reisen.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-day",
                target: "hud-day",
                title: "Tag und Spieldauer",
                body: "In der Mitte der oberen Leiste siehst du, an welchem Tag ihr gerade seid und wie lange die Session insgesamt dauert.",
                nextLabel: "Weiter",
                clickTarget: false,
                freezeHighlight: true,
            },
            {
                id: "hud-homeport",
                target: "hud-homeport",
                title: "Dein Heimathafen",
                body: "Rechts siehst du deinen Heimathafen.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-faction",
                target: "hud-faction",
                title: "Deine Fraktion",
                body: "Hier steht deine Fraktion. Sie bestimmt deinen Stil im Spiel, behalte das im Kopf.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-leaderboard",
                target: "hud-leaderboard",
                title: "Rangliste",
                body: "Über die Rangliste vergleichst du dich mit den anderen Spielern. Gewertet wird dein gesamter Fortschritt im Spiel.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-menu",
                target: "hud-menu",
                title: "Menü und Hilfecenter",
                body: "Ganz rechts öffnest du das Menü. Dort findest du Audio-Einstellungen, das Hilfecenter und den Weg zurück zur Lobby.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "hud-chat",
                target: "hud-chat",
                title: "Session-Chat",
                body: "Unten links findest du den Chat für diese Spielrunde. Dort kannst du mit den anderen Spielern schreiben und neue Nachrichten erkennen.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "ship-market",
                target: "open-ship-market",
                title: "Schiffsmarkt öffnen",
                body: "Hier kaufst du dein erstes Schiff. Klicke auf den Schiffsmarkt, dann suchen wir gemeinsam ein passendes Schiff aus.",
                nextLabel: "Klicken und weiter",
            },
            {
                id: "buy-ship",
                target: "ship-card-purchase",
                title: "Schiff kaufen",
                body: "Wähle ein bezahlbares Schiff und klicke auf Kaufen. Danach schließen wir den Markt und wählen dein neues Schiff aus.",
                waitBody: "Der Schiffsmarkt lädt noch oder es gibt gerade kein kaufbares Schiff. Sobald ein Kaufbutton sichtbar ist, geht es weiter.",
                nextLabel: "Kaufen und weiter",
                clickSelector: '[data-tutorial="buy-ship"]',
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
                targetSelector: '.ship-status-card[data-ship-status="AT_PORT"]',
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
                id: "pilotage",
                target: "pilotage-toggle",
                title: "Lotsendienst prüfen",
                body: "Vor dem Start kannst du optional den Lotsendienst buchen. Er kostet 1.000 Taler und hilft beim sicheren Ablegen oder Ankommen, wenn er verfügbar ist.",
                waitBody: "Sobald die Fracht fertig geladen ist, erscheint hier der Lotsendienst. Du musst ihn nicht buchen, wir erklären nur die Option.",
                nextLabel: "Weiter",
                clickTarget: false,
                allowDisabled: true,
                hideActionsWhenWaiting: true,
            },
            {
                id: "start-travel",
                target: "start-travel",
                title: "Reise starten",
                body: "Wenn die Fracht bereit ist, startest du hier die erste Reise. Ob du wirklich startest, entscheidest du selbst.",
                waitBody: "Die Fracht wird noch vorbereitet. Sobald die Reise bereit ist, markieren wir den Startbutton.",
                nextLabel: "Abschließen",
                clickTarget: false,
            },
        ],
    },
    emptyVoyage: {
        id: "emptyVoyage",
        kicker: "Leerfahrt",
        promptTitle: "Leerfahrt kurz erklären?",
        promptBody: "Wir zeigen dir einmal, wie du ein Schiff ohne Fracht zu einem anderen Hafen schicken könntest. Gestartet wird dabei nichts automatisch.",
        steps: [
            {
                id: "select-port-ship",
                targetSelector: '[data-tutorial="ship-card"][data-ship-status="AT_PORT"]',
                title: "Schiff im Hafen auswählen",
                body: "Wähle unten ein Schiff aus, das gerade im Hafen steht. Dadurch öffnet sich die Frachtbörse direkt für dieses Schiff.",
                waitBody: "Für eine Leerfahrt brauchst du ein Schiff, das aktuell im Hafen steht.",
                nextLabel: "Schiff auswählen",
            },
            {
                id: "open-empty-voyage",
                target: "switch-empty-voyage-tab",
                title: "Leerfahrt öffnen",
                body: "Wechsle hier von der Frachtbörse in den Bereich Leerfahrt. Dort planst du eine Fahrt ohne Fracht.",
                waitBody: "Sobald die Frachtbörse geöffnet ist, markieren wir hier den Wechsel zur Leerfahrt.",
                nextLabel: "Leerfahrt öffnen",
            },
            {
                id: "choose-port",
                target: "empty-voyage-port",
                title: "Zielhafen wählen",
                body: "Wähle einen Zielhafen aus. Danach berechnet das Spiel Entfernung, Dauer und Treibstoffbedarf.",
                waitBody: "Die Häfen werden geladen. Sobald ein Ziel sichtbar ist, markieren wir es hier.",
                nextLabel: "Zielhafen wählen",
            },
            {
                id: "empty-speed",
                target: "empty-voyage-speed",
                title: "Tempo und Tank prüfen",
                body: "Auch ohne Fracht kostet die Fahrt Treibstoff. Hier siehst du, welches Tempo möglich ist und wie lange die Reise dauern würde.",
                waitBody: "Wähle zuerst einen Zielhafen, damit die Geschwindigkeit berechnet werden kann.",
                nextLabel: "Weiter",
                clickTarget: false,
                hideActionsWhenWaiting: true,
            },
            {
                id: "prepare-empty",
                target: "prepare-empty-voyage",
                title: "Leerfahrt vorbereiten",
                body: "Mit diesem Button würdest du die Leerfahrt starten. Im Tutorial zeigen wir nur, wo das geht; dein Schiff bleibt hier.",
                nextLabel: "Abschließen",
                clickTarget: false,
                allowDisabled: true,
            },
        ],
    },
    postTravel: {
        id: "postTravel",
        kicker: "Nach der Reise",
        promptTitle: "Ankunft und Entladen erklären?",
        promptBody: "Wir zeigen dir, was nach dem Reisestart passiert: Entladen, Auftragszusammenfassung und wo du abgeschlossene Aufträge findest.",
        steps: [
            {
                id: "orders",
                target: "orders",
                title: "Aufträge öffnen",
                body: "Nach dem Start verfolgst du die Reise und später die Entladung in den Aufträgen.",
                nextLabel: "Aufträge öffnen",
            },
            {
                id: "unloading",
                target: "unloading-progress",
                title: "Entladen beobachten",
                body: "Wenn das Schiff angekommen ist, wird die Fracht entladen. Der Balken zeigt dir, wann der Auftrag abgeschlossen ist.",
                waitBody: "Sobald ein Schiff entlädt, markieren wir hier den Entladefortschritt.",
                nextLabel: "Weiter",
                clickTarget: false,
                autoAdvanceOnTargetLoss: true,
            },
            {
                id: "summary",
                target: "travel-summary",
                title: "Zusammenfassung lesen",
                body: "Nach dem Entladen siehst du hier die Abrechnung: Grundbelohnung, Boni, Strafen, Minispiel-Ergebnisse und den Netto-Gewinn.",
                waitBody: "Sobald ein Auftrag abgeschlossen ist, erscheint hier die Zusammenfassung.",
                nextLabel: "Abschließen",
                clickTarget: false,
            },
        ],
    },
    service: {
        id: "service",
        kicker: "Schiff warten",
        promptTitle: "Betanken und Reparieren erklären?",
        promptBody: "Wir zeigen dir einmal, wo du ein Schiff nach Reisen wieder auftankst und reparierst.",
        steps: [
            {
                id: "open-office",
                target: "office",
                title: "Büro öffnen",
                body: "Im Hafenmeister-Büro verwaltest du deine Flotte. Dort kannst du Schiffe auftanken, reparieren oder verkaufen.",
                nextLabel: "Büro öffnen",
            },
            {
                id: "office-ship",
                target: "office-ship-card",
                title: "Schiff auswählen",
                body: "Wähle links das Schiff aus, das du warten möchtest. Rechts erscheinen Tank, Zustand und Aktionen.",
                waitBody: "Sobald deine Flotte geladen ist, kannst du hier ein Schiff auswählen.",
                nextLabel: "Schiff auswählen",
            },
            {
                id: "refuel",
                target: "office-refuel-card",
                title: "Betanken",
                body: "Hier füllst du Treibstoff nach. Du kannst die Tankmenge einstellen und siehst die Kosten vor dem Start.",
                nextLabel: "Weiter",
                clickTarget: false,
                allowDisabled: true,
            },
            {
                id: "repair",
                target: "office-repair-card",
                title: "Reparieren",
                body: "Hier reparierst du Schäden. Ein guter Zustand senkt das Risiko, dass unterwegs Probleme entstehen.",
                nextLabel: "Abschließen",
                clickTarget: false,
                allowDisabled: true,
            },
        ],
    },
    luxuryFreight: {
        id: "luxuryFreight",
        kicker: "Luxusfracht",
        promptTitle: "Luxusfrachten kurz erklären?",
        promptBody: "Zum ersten Mal ist irgendwo im Spiel eine Luxusfracht aufgetaucht. Wir zeigen dir kurz, woran du sie erkennst und wie du sie annimmst.",
        steps: [
            {
                id: "luxury-intro",
                target: "luxury-port-marker",
                title: "Was ist Luxusfracht?",
                body: "Luxusfrachten bringen besonders hohe Belohnungen. Häfen mit verfügbarer Luxusfracht leuchten auf der Weltkarte golden auf.",
                waitBody: "Sobald ein Hafen mit Luxusfracht golden leuchtet, markieren wir ihn hier für dich.",
                nextLabel: "Weiter",
                clickTarget: false,
            },
            {
                id: "luxury-requirement",
                title: "Welche Schiffe können sie annehmen?",
                body: "Luxusgüter sind gross und wertvoll. Budget-Schiffe reichen dafür nicht aus. Du brauchst mindestens ein Schiff ab der Klasse Standard.",
                nextLabel: "Weiter",
            },
            {
                id: "luxury-accept",
                title: "Wie nimmst du sie an?",
                body: "Fahre zu einem gold markierten Hafen, öffne die Frachtbörse und wähle dort die Luxusfracht aus. Danach nimmst du sie wie jede andere Fracht über den Reise-Button an.",
                nextLabel: "Abschliessen",
            },
        ],
    },
};

function storageKey(playerId: string | null, chapterId: TutorialChapterId): string {
    return `${STORAGE_PREFIX}:${chapterId}:${playerId ?? "guest"}`;
}

function legacyFirstJourneyStorageKey(playerId: string | null): string {
    return `${LEGACY_FIRST_JOURNEY_STORAGE_PREFIX}:${playerId ?? "guest"}`;
}

export function hasSeenTutorial(playerId: string | null, chapterId: TutorialChapterId): boolean {
    return localStorage.getItem(storageKey(playerId, chapterId)) === "true"
        || (chapterId === "firstJourney" && localStorage.getItem(legacyFirstJourneyStorageKey(playerId)) === "true");
}

function findTarget(selectorName: string): HTMLElement | null {
    const enabled = document.querySelector<HTMLElement>(`[data-tutorial="${selectorName}"]:not(:disabled)`);
    return enabled ?? document.querySelector<HTMLElement>(`[data-tutorial="${selectorName}"]`);
}

function findTargetBySelector(selector: string): HTMLElement | null {
    const enabled = document.querySelector<HTMLElement>(`${selector}:not(:disabled)`);
    return enabled ?? document.querySelector<HTMLElement>(selector);
}

function findVirtualTargetRect(selectorName: string): DOMRect | null {
    if (selectorName !== "luxury-port-marker") return null;
    const luxuryPortId = window.__luxuryPortIds?.[0];
    const port = window.__latestPorts?.find(entry => entry.id === luxuryPortId);
    const canvas = document.querySelector("canvas");
    if (!luxuryPortId || !port || !canvas) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + (port.x / 100) * canvasRect.width;
    const centerY = canvasRect.top + (port.y / 100) * canvasRect.height;
    const size = 36;

    return new DOMRect(centerX - size / 2, centerY - size / 2, size, size);
}

function hasOwnedShipAvailable(): boolean {
    return document.querySelector('[data-tutorial="ship-card"]') !== null;
}

function hasAtPortShipAvailable(): boolean {
    return document.querySelector('[data-tutorial="ship-card"][data-ship-status="AT_PORT"]') !== null;
}

export function requestTutorialRestart() {
    requestTutorialPrompt("firstJourney", true);
}

export function requestTutorialPrompt(chapterId: TutorialChapterId, force = false) {
    window.dispatchEvent(new CustomEvent(RESTART_EVENT, { detail: { chapterId, force } }));
}

function getTutorialViewportSize(): TutorialViewportSize {
    const fullscreenRoot = document.fullscreenElement as HTMLElement | null;
    if (fullscreenRoot) {
        const rect = fullscreenRoot.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            return {
                width: rect.width,
                height: rect.height,
            };
        }
    }

    return {
        width: window.innerWidth,
        height: window.innerHeight,
    };
}

export default function InteractiveTutorial({ playerId }: InteractiveTutorialProps) {
    const [mode, setMode] = useState<TutorialMode>("closed");
    const [chapterId, setChapterId] = useState<TutorialChapterId>("firstJourney");
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [targetAvailable, setTargetAvailable] = useState(false);
    const [manualReplay, setManualReplay] = useState(false);
    const [promptNotice, setPromptNotice] = useState<TutorialPromptNotice | null>(null);
    const [viewportSize, setViewportSize] = useState<TutorialViewportSize>(() => getTutorialViewportSize());
    const modeRef = useRef<TutorialMode>("closed");
    const lastTargetAvailableRef = useRef(false);
    const lastScrolledStepRef = useRef<string | null>(null);
    const frozenHighlightStepRef = useRef<string | null>(null);
    const chapter = TUTORIAL_CHAPTERS[chapterId];
    const key = useMemo(() => storageKey(playerId, chapterId), [playerId, chapterId]);
    const portalTarget = document.fullscreenElement ?? document.body;

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        const updateViewportSize = () => {
            setViewportSize(getTutorialViewportSize());
        };

        updateViewportSize();
        window.addEventListener("resize", updateViewportSize);
        document.addEventListener("fullscreenchange", updateViewportSize);
        return () => {
            window.removeEventListener("resize", updateViewportSize);
            document.removeEventListener("fullscreenchange", updateViewportSize);
        };
    }, []);

    const closeAndRemember = useCallback(() => {
        localStorage.setItem(key, "true");
        setPromptNotice(null);
        modeRef.current = "closed";
        setMode("closed");
    }, [key]);

    const startTour = useCallback(() => {
        localStorage.setItem(key, "true");
        setPromptNotice(null);
        setStepIndex(0);
        modeRef.current = "tour";
        setMode("tour");
    }, [key]);

    useEffect(() => {
        if (hasSeenTutorial(playerId, "firstJourney")) return;
        const id = window.setTimeout(() => {
            setChapterId("firstJourney");
            setManualReplay(false);
            setPromptNotice(null);
            modeRef.current = "prompt";
            setMode("prompt");
        }, 650);
        return () => window.clearTimeout(id);
    }, [playerId]);

    useEffect(() => {
        const restart = (event: Event) => {
            const detail = (event as CustomEvent<{ chapterId?: TutorialChapterId; force?: boolean }>).detail;
            let nextChapterId = detail?.chapterId ?? "firstJourney";
            if (!TUTORIAL_CHAPTERS[nextChapterId]) return;
            if (modeRef.current !== "closed" && !detail?.force) return;
            if (nextChapterId !== "firstJourney" && !hasSeenTutorial(playerId, "firstJourney")) return;
            if (!detail?.force && hasSeenTutorial(playerId, nextChapterId)) return;
            if (nextChapterId === "emptyVoyage" && !hasOwnedShipAvailable()) {
                nextChapterId = "firstJourney";
            }
            const shouldBlockEmptyVoyage =
                nextChapterId === "emptyVoyage"
                && hasOwnedShipAvailable()
                && !hasAtPortShipAvailable();

            setChapterId(nextChapterId);
            setStepIndex(0);
            setManualReplay(Boolean(detail?.force) && nextChapterId !== "firstJourney");
            setPromptNotice(shouldBlockEmptyVoyage ? {
                title: "Leerfahrt aktuell nicht möglich",
                body: "Momentan kann dieses Tutorial nicht gestartet werden, weil gerade kein Schiff bereits im Hafen steht.",
            } : null);
            modeRef.current = "prompt";
            setMode("prompt");
        };
        window.addEventListener(RESTART_EVENT, restart);
        return () => window.removeEventListener(RESTART_EVENT, restart);
    }, [playerId]);

    useLayoutEffect(() => {
        if (mode !== "tour") return;
        const step = chapter.steps[stepIndex];
        lastTargetAvailableRef.current = false;
        lastScrolledStepRef.current = null;
        frozenHighlightStepRef.current = null;
        setTargetRect(null);
        const updateTarget = () => {
            if (!step.target) {
                if (!step.targetSelector) {
                    setTargetAvailable(true);
                    setTargetRect(null);
                    return;
                }
            }
            const target = step.targetSelector
                ? findTargetBySelector(step.targetSelector)
                : (step.target ? findTarget(step.target) : null);
            const fallback = step.fallbackTarget ? findTarget(step.fallbackTarget) : null;
            const virtualRect = step.target ? findVirtualTargetRect(step.target) : null;
            const disabled = Boolean((target as HTMLButtonElement | null)?.disabled);
            const nextTargetAvailable = Boolean(virtualRect || (target && (step.allowDisabled || !disabled)));
            setTargetAvailable(nextTargetAvailable);
            const spotlightTarget = target ?? fallback;
            const nextRect = virtualRect ?? spotlightTarget?.getBoundingClientRect() ?? null;
            setTargetRect(currentRect => {
                if (
                    step.freezeHighlight
                    && currentRect
                    && nextTargetAvailable
                    && frozenHighlightStepRef.current === step.id
                ) {
                    return currentRect;
                }
                if (step.freezeHighlight && nextRect && nextTargetAvailable) {
                    frozenHighlightStepRef.current = step.id;
                }
                return nextRect;
            });
            if (!virtualRect && spotlightTarget && lastScrolledStepRef.current !== step.id) {
                lastScrolledStepRef.current = step.id;
                spotlightTarget?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
            }
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
    }, [chapter.steps, mode, stepIndex]);

    useEffect(() => {
        if (mode !== "tour") return;
        const step = chapter.steps[stepIndex];
        if (!step.autoAdvanceOnTargetLoss) {
            lastTargetAvailableRef.current = targetAvailable;
            return;
        }
        if (lastTargetAvailableRef.current && !targetAvailable && stepIndex < chapter.steps.length - 1) {
            lastTargetAvailableRef.current = false;
            setStepIndex(i => i + 1);
            return;
        }
        lastTargetAvailableRef.current = targetAvailable;
    }, [chapter.steps, mode, stepIndex, targetAvailable]);

    if (mode === "closed") return null;

    const finish = () => {
        audioEngine.playSfx("buttonClick");
        closeAndRemember();
    };

    const runAfterPointerSequence = (action: () => void) => {
        window.setTimeout(action, 0);
    };

    const consumePointerEvent = (event: ReactMouseEvent | ReactPointerEvent) => {
        event.stopPropagation();
    };

    const stopPointerEvent = (event: ReactMouseEvent | ReactPointerEvent) => {
        event.stopPropagation();
    };

    const prompt = (
        <div
            className="tutorial-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Tutorial starten"
            onMouseDown={consumePointerEvent}
            onMouseUp={consumePointerEvent}
            onClick={consumePointerEvent}
            onPointerDown={consumePointerEvent}
            onPointerUp={consumePointerEvent}
        >
            <div
                className="tutorial-prompt"
                onMouseDown={stopPointerEvent}
                onMouseUp={stopPointerEvent}
                onClick={stopPointerEvent}
                onPointerDown={stopPointerEvent}
                onPointerUp={stopPointerEvent}
            >
                <div className="tutorial-kicker">{chapter.kicker}</div>
                <h2>{promptNotice?.title ?? chapter.promptTitle}</h2>
                <p>{promptNotice?.body ?? chapter.promptBody}</p>
                <div className="tutorial-actions">
                    {promptNotice ? (
                        <button
                            type="button"
                            className="tutorial-btn primary"
                            onMouseDown={stopPointerEvent}
                            onMouseUp={stopPointerEvent}
                            onPointerDown={stopPointerEvent}
                            onPointerUp={stopPointerEvent}
                            onClick={(event) => {
                                stopPointerEvent(event);
                                audioEngine.playSfx("buttonClick");
                                runAfterPointerSequence(closeAndRemember);
                            }}
                        >
                            Verstanden
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="tutorial-btn secondary"
                                onMouseDown={stopPointerEvent}
                                onMouseUp={stopPointerEvent}
                                onPointerDown={stopPointerEvent}
                                onPointerUp={stopPointerEvent}
                                onClick={(event) => {
                                    stopPointerEvent(event);
                                    audioEngine.playSfx("buttonClick");
                                    runAfterPointerSequence(closeAndRemember);
                                }}
                            >
                                Nein, überspringen
                            </button>
                            <button
                                type="button"
                                className="tutorial-btn primary"
                                onMouseDown={stopPointerEvent}
                                onMouseUp={stopPointerEvent}
                                onPointerDown={stopPointerEvent}
                                onPointerUp={stopPointerEvent}
                                onClick={(event) => {
                                    stopPointerEvent(event);
                                    audioEngine.playSfx("buttonClick");
                                    runAfterPointerSequence(startTour);
                                }}
                            >
                                Ja, Tutorial starten
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (mode === "prompt") {
        return createPortal(prompt, portalTarget);
    }

    const step = chapter.steps[stepIndex];
    const isLast = stepIndex === chapter.steps.length - 1;
    const cardWidth = Math.min(420, viewportSize.width - 32);
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
            left: Math.min(
                Math.max(
                    18,
                    targetRect.left + targetRect.width / 2 > viewportSize.width / 2
                        ? targetRect.right - cardWidth
                        : targetRect.left
                ),
                viewportSize.width - cardWidth - 18
            ),
            top: targetRect.bottom + 18 < viewportSize.height - 280
                ? targetRect.bottom + 18
                : Math.max(18, targetRect.top - 250),
        }
        : {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
        };

    const goNext = () => {
        const target = step.targetSelector
            ? findTargetBySelector(step.targetSelector)
            : (step.target ? findTarget(step.target) : null);
        if ((step.target || step.targetSelector) && targetAvailable && target && step.clickTarget !== false) {
            audioEngine.playSfx("buttonClick");
            const clickTarget = step.clickSelector
                ? target.querySelector<HTMLElement>(step.clickSelector) ?? target
                : target;
            clickTarget.click();
        }
        if (isLast) {
            closeAndRemember();
            return;
        }
        setTargetRect(null);
        frozenHighlightStepRef.current = null;
        setStepIndex(i => i + 1);
    };

    const tour = (
        <div
            className="tutorial-layer"
            aria-live="polite"
            onMouseDown={consumePointerEvent}
            onMouseUp={consumePointerEvent}
            onClick={consumePointerEvent}
            onPointerDown={consumePointerEvent}
            onPointerUp={consumePointerEvent}
        >
            {targetRect && <div className="tutorial-spotlight" style={rectStyle} />}
            <div
                className="tutorial-card"
                style={cardStyle}
                onMouseDown={stopPointerEvent}
                onMouseUp={stopPointerEvent}
                onClick={stopPointerEvent}
                onPointerDown={stopPointerEvent}
                onPointerUp={stopPointerEvent}
            >
                <div className="tutorial-progress">Schritt {stepIndex + 1} von {chapter.steps.length}</div>
                <h2>{step.title}</h2>
                <p>{targetAvailable ? step.body : (step.waitBody ?? step.body)}</p>
                {!(step.hideActionsWhenWaiting && !targetAvailable) && (
                    <div className="tutorial-actions">
                        <button type="button" className="tutorial-btn secondary" onClick={finish}>
                            Tutorial beenden
                        </button>
                        <button
                            type="button"
                            className="tutorial-btn primary"
                            onClick={goNext}
                            disabled={!manualReplay && !targetAvailable && !isLast}
                        >
                            {isLast ? "Abschließen" : step.nextLabel ?? "Weiter"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(tour, portalTarget);
}
