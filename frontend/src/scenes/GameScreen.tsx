import { useEffect, useCallback, useState, useRef } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import SideBar from "../components/SideBar";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";
import OfficeScene from "../scenes/OfficeScene.tsx";
import PortProfileScreen from "../scenes/PortProfileScreen.tsx";
import { useGameSessionWebSocket } from "../hooks/useGameSessionWebSocket.ts";
import CargoManagementScreen from "../scenes/CargoManagementScreen";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import RewardToast from "../components/RewardToast.tsx";
import SmuggleOfferDialog from "../components/SmuggleOfferDialog.tsx";
import CustomsInspectionDialog from "../components/CustomsInspectionDialog.tsx";
import CustomsResultToast, { type CustomsToastKind } from "../components/CustomsResultToast.tsx";
import RatMinigameOverlay from "../minigame/rats/RatMinigameOverlay.tsx";
import type { RatMinigameEventPayload, RatMinigameResult } from "../minigame/rats/RatMinigameTypes.ts";
import EventNotificationDialog from "../components/EventNotificationDialog.tsx";
import ratImage from "../assets/Rat.png";

export const TOP_BAR_HEIGHT = '9vh';
export const BOTTOM_BAR_HEIGHT = '20vh';

interface CustomsInspectionPayload {
    inspectionId: string;
    playerId: string;
    travelId: string;
    playerShipId: string;
    shipName: string;
    originPortName: string;
    destinationPortName: string;
    fineAmount: number;
    bribeCost: number;
    detentionTicks: number;
    illegalCargoLabels: string[];
}

interface CustomsToast {
    id: string;
    kind: CustomsToastKind;
    shipName: string;
    from: string;
    to: string;
}

export default function GameScreen() {
    const [view, setView] = useState<"map" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office">("map");
    const viewRef = useRef(view);
    const [selectedPort, setSelectedPort] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const tickRateSeconds: number = sessionData ? (JSON.parse(sessionData).tickRateSeconds ?? 30) : 30;

    const userData = localStorage.getItem('crowns_user');
    const playerId: string | null = userData ? JSON.parse(userData).id : null;

    const [assignedCargos, setAssignedCargos] = useState<AssignedCargoEntry[]>([]);
    const [rewardToasts, setRewardToasts] = useState<{
        id: string; shipName: string; from: string; to: string; reward: number;
    }[]>([]);
    const [ratResultToasts, setRatResultToasts] = useState<{
        id: string;
        success: boolean;
        message: string;
    }[]>([]);
    const [customsToasts, setCustomsToasts] = useState<CustomsToast[]>([]);
    const [smuggleOffer, setSmuggleOffer] = useState<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const [customsInspection, setCustomsInspection] = useState<CustomsInspectionPayload | null>(null);
    const customsQueueRef = useRef<CustomsInspectionPayload[]>([]);
    const [ratEventOffer, setRatEventOffer] = useState<RatMinigameEventPayload | null>(null);
    const [activeRatMinigame, setActiveRatMinigame] = useState<RatMinigameEventPayload | null>(null);

    const pendingSmuggleRef = useRef<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const departureActiveRef = useRef(false);

    function handleCargoAssigned(entry: AssignedCargoEntry) {
        setAssignedCargos(prev => {
            if (prev.some(e => e.cargoId === entry.cargoId)) return prev;
            return [...prev, entry];
        });
    }

    function handleCargoCompleted(cargoId: string) {
        setAssignedCargos(prev =>
            prev.map(e => e.cargoId === cargoId ? { ...e, loadingDone: true } : e)
        );
    }

    function handleCargoRemoved(cargoId: string) {
        setAssignedCargos(prev => prev.filter(e => e.cargoId !== cargoId));
    }

    function handleCargoPhaseChange(cargoId: string, phase: AssignedCargoEntry["phase"], travelId?: string) {
        setAssignedCargos(prev => prev.map(e =>
            e.cargoId === cargoId ? { ...e, phase, ...(travelId ? { travelId } : {}) } : e
        ));
    }

    useEffect(() => {
        viewRef.current = view;
        window.__activeGameView = view;
    }, [view]);

    useEffect(() => {
        if (typeof window.__tickRateMs !== 'number' || !Number.isFinite(window.__tickRateMs) || window.__tickRateMs <= 0) {
            window.__tickRateMs = tickRateSeconds * 1000;
        }
    }, [tickRateSeconds]);

    useEffect(() => {
        const onPortClicked = (e: Event) => {
            if (viewRef.current !== "map") return;
            const port = (e as CustomEvent).detail;
            setSelectedPort(port);
            setView("portProfile");
        };
        window.addEventListener('port-clicked', onPortClicked);
        return () => window.removeEventListener('port-clicked', onPortClicked);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{
                currentTick: number;
                ships: {
                    playerShipId: string;
                    status: string;
                    arrivalTick?: number;
                    startTick?: number;
                    currentPortId?: string;
                    travelId?: string;
                    paused?: boolean;
                }[]
            }>).detail;

            setAssignedCargos(prev => prev.map(entry => {
                if (entry.phase !== "en_route"
                    && entry.phase !== "customs_check"
                    && entry.phase !== "blocked"
                    && entry.phase !== "unloading") return entry;
                const ship = detail.ships.find(s => s.playerShipId === entry.shipId);
                if (!ship) return entry;
                if (ship.status === "CUSTOMS_CHECK") {
                    return {
                        ...entry,
                        phase: "customs_check",
                        currentTick: detail.currentTick,
                        customsCheckCompletedAtTick: ship.arrivalTick,
                        customsCheckStartTick: entry.customsCheckStartTick ?? detail.currentTick,
                        paused: false,
                    };
                }
                if (ship.status === "BLOCKED") {
                    return {
                        ...entry,
                        phase: "blocked",
                        currentTick: detail.currentTick,
                        customsBlockedUntilTick: ship.arrivalTick,
                        customsBlockStartTick: entry.phase === "blocked"
                            ? (entry.customsBlockStartTick ?? detail.currentTick)
                            : detail.currentTick,
                        paused: false,
                    };
                }
                if (ship.status === "UNLOADING") {
                    return {
                        ...entry,
                        phase: "unloading",
                        arrivalTick: ship.arrivalTick,
                        currentTick: detail.currentTick,
                        unloadingCompletedAtTick: ship.arrivalTick,
                        unloadingStartTick: entry.unloadingStartTick ?? detail.currentTick,
                        paused: false,
                    };
                }
                if (ship.status === "EN_ROUTE") {
                    const isPaused = ship.paused === true;
                    return {
                        ...entry,
                        currentTick: isPaused ? (entry.currentTick ?? detail.currentTick) : detail.currentTick,
                        arrivalTick: ship.arrivalTick ?? entry.arrivalTick,
                        startTick: entry.startTick ?? ship.startTick,
                        paused: isPaused,
                    };
                }
                return entry;
            }));
        };
        window.addEventListener("backend-ship-positions", handler);
        return () => window.removeEventListener("backend-ship-positions", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<{
                travelId: string;
                playerId: string;
                totalReward: number;
                baseReward: number;
                cargoRewards: { cargoId: string; cargoName: string; destinationPort: string; baseReward: number; bonusReward: number; actualReward: number; percentage: number; status: string; cargoType: string }[];
                ratMinigameSummary?: {
                    triggered: boolean;
                    result?: "SUCCESS" | "FAILED";
                    penaltyAmount?: number;
                };
                customsSummary?: {
                    outcome: "CLEARED" | "HIDDEN" | "COOPERATED" | "BRIBE_SUCCESS" | "BRIBE_FAILED";
                    finePaid: number;
                    bribePaid: number;
                    bribeAttempted: boolean;
                    detained: boolean;
                    detentionTicks: number;
                    wasCarryingIllegalCargo: boolean;
                } | null;
                regressSummary?: {
                    delayTicks: number;
                    toleranceTicks: number;
                    overdueTicks: number;
                    delayComponent: number;
                    damageComponent: number;
                    damagePercent: number;
                    specialCargoMultiplier: number;
                    hadPerishableCargo: boolean;
                    hadFragileCargo: boolean;
                    totalFine: number;
                } | null;
            }>).detail;
            if (data.playerId !== playerId) return;

            window.dispatchEvent(new CustomEvent("player-balance-updated"));

            setAssignedCargos(prev => {
                const updated = prev.map(entry => {
                    if (entry.travelId !== data.travelId) return entry;
                    const firstCargo = data.cargoRewards.find(r => r.cargoType !== "SMUGGLE");
                    return {
                        ...entry,
                        phase: "completed" as const,
                        reward: data.totalReward,
                        rewardDetails: firstCargo
                            ? {
                                baseReward: firstCargo.baseReward,
                                actualReward: firstCargo.actualReward,
                                percentage: firstCargo.percentage
                            }
                            : undefined,
                        cargoRewards: data.cargoRewards,
                        ratMinigameSummary: data.ratMinigameSummary,
                        customsSummary: data.customsSummary ?? undefined,
                        regressSummary: data.regressSummary ?? undefined,
                    };
                });
                return updated;
            });

            setAssignedCargos(prev => {
                const matched = prev.find(e => e.travelId === data.travelId);
                if (matched) {
                    setRewardToasts(t => {
                        if (t.some(toast => toast.id === data.travelId)) return t;
                        return [...t, {
                            id: data.travelId,
                            shipName: matched.shipName,
                            from: matched.from,
                            to: matched.to,
                            reward: data.totalReward,
                        }];
                    });
                }
                return prev;
            });
        };
        window.addEventListener("travel-complete", handler);
        return () => window.removeEventListener("travel-complete", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<{
                offerId: string; playerId: string; portId: string;
                travelId: string; playerShipId: string;
                reward: number; cargoDescription: string;
            }>).detail;
            if (data.playerId !== playerId) return;
            const offer = {
                offerId: data.offerId,
                portId: data.portId,
                travelId: data.travelId,
                playerShipId: data.playerShipId,
                reward: data.reward,
                cargoDescription: data.cargoDescription,
            };
            if (departureActiveRef.current) {
                pendingSmuggleRef.current = offer;
            } else {
                setSmuggleOffer(offer);
            }
        };
        window.addEventListener("smuggle-offer", handler);
        return () => window.removeEventListener("smuggle-offer", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<CustomsInspectionPayload>).detail;
            if (data.playerId !== playerId) return;
            setCustomsInspection(current => {
                if (current !== null) {
                    customsQueueRef.current.push(data);
                    return current;
                }
                return data;
            });
        };
        window.addEventListener("customs-inspection", handler);
        return () => window.removeEventListener("customs-inspection", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<{
                playerId: string;
                travelId: string;
                shipName: string;
                originPortName: string;
                destinationPortName: string;
                outcome: CustomsToastKind;
            }>).detail;
            if (data.playerId !== playerId) return;
            const id = `customs-${data.travelId}-${Date.now()}`;
            setCustomsToasts(prev => [
                ...prev,
                {
                    id,
                    kind: data.outcome,
                    shipName: data.shipName,
                    from: data.originPortName,
                    to: data.destinationPortName,
                },
            ]);
        };
        window.addEventListener("customs-pass", handler);
        window.addEventListener("customs-resolved", handler);
        return () => {
            window.removeEventListener("customs-pass", handler);
            window.removeEventListener("customs-resolved", handler);
        };
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<RatMinigameEventPayload>).detail;
            if (data.playerId !== playerId) return;
            if (window.__activeRatEventId === data.eventId) return;
            window.__activeRatEventId = data.eventId;
            setRatEventOffer(data);
        };

        window.addEventListener("rats-event", handler);
        return () => window.removeEventListener("rats-event", handler);
    }, [playerId]);

    const handleDepartureComplete = useCallback(() => {
        departureActiveRef.current = false;
        const pending = pendingSmuggleRef.current;
        if (pending) {
            pendingSmuggleRef.current = null;
            setTimeout(() => setSmuggleOffer(pending), 1000);
        }
    }, []);

    const handleDepartureStarted = useCallback(() => {
        departureActiveRef.current = true;
        pendingSmuggleRef.current = null;
    }, []);

    async function handleSmuggleAccept() {
        if (!smuggleOffer) return;
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            const res = await fetch(
                `/api/smuggle/accept?playerId=${playerId}&sessionId=${sessionId}&offerId=${smuggleOffer.offerId}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                setSmuggleOffer(null);
            } else {
                setSmuggleOffer(null);
            }
        } catch {
            setSmuggleOffer(null);
        }
    }

    function handleSmuggleDecline() {
        if (!smuggleOffer) return;
        const token = localStorage.getItem("auth_token") ?? "";
        fetch(
            `/api/smuggle/decline?playerId=${playerId}&offerId=${smuggleOffer.offerId}`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
        setSmuggleOffer(null);
    }

    const handleCustomsCooperate = useCallback(async () => {
        if (!customsInspection) return;
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            await fetch(
                `/api/customs/cooperate?playerId=${playerId}&inspectionId=${customsInspection.inspectionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Customs cooperate failed:", err);
        }
    }, [customsInspection, playerId]);

    const handleCustomsBribe = useCallback(async (): Promise<"BRIBE_SUCCESS" | "BRIBE_FAILED" | "ERROR"> => {
        if (!customsInspection) return "ERROR";
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            const res = await fetch(
                `/api/customs/bribe?playerId=${playerId}&inspectionId=${customsInspection.inspectionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return "ERROR";
            const data = await res.json();
            const outcome = data.outcome as string;
            if (outcome === "BRIBE_SUCCESS" || outcome === "BRIBE_FAILED") {
                return outcome;
            }
            return "ERROR";
        } catch (err) {
            console.error("Customs bribe failed:", err);
            return "ERROR";
        }
    }, [customsInspection, playerId]);

    const handleCustomsDismiss = useCallback(() => {
        setCustomsInspection(() => {
            const next = customsQueueRef.current.shift();
            return next ?? null;
        });
    }, []);

    const submitRatResult = useCallback(async (payload: {
        eventId: string;
        travelId: string;
        result: "SUCCESS" | "FAILED";
        hits: number;
        requiredHits: number;
        remainingSeconds: number;
        timeLimitSeconds: number;
    }) => {
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            await fetch(`/api/minigames/rats/result?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventId: payload.eventId,
                    travelId: payload.travelId,
                    result: payload.result,
                    hits: payload.hits,
                    requiredHits: payload.requiredHits,
                    remainingSeconds: payload.remainingSeconds,
                    timeLimitSeconds: payload.timeLimitSeconds,
                }),
            });
        } catch {
        }
    }, [playerId, sessionId]);

    const handleRatEventAccept = useCallback(() => {
        if (!ratEventOffer) return;
        setActiveRatMinigame(ratEventOffer);
        setRatEventOffer(null);
    }, [ratEventOffer]);

    const handleRatEventDecline = useCallback(async () => {
        if (!ratEventOffer) return;

        await submitRatResult({
            eventId: ratEventOffer.eventId,
            travelId: ratEventOffer.travelId,
            result: "FAILED",
            hits: 0,
            requiredHits: ratEventOffer.requiredHits,
            remainingSeconds: 0,
            timeLimitSeconds: ratEventOffer.timeLimitSeconds,
        });

        window.__activeRatEventId = undefined;
        setRatEventOffer(null);
        const id = `rat-result-${Date.now()}`;
        setRatResultToasts(prev => [...prev, {
            id,
            success: false,
            message: "Ratten-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setRatResultToasts(prev => prev.filter(toast => toast.id !== id));
        }, 2600);
    }, [ratEventOffer, submitRatResult]);

    const handleRatMinigameFinished = useCallback(async (result: RatMinigameResult) => {
        if (!activeRatMinigame) return;

        await submitRatResult({
            eventId: activeRatMinigame.eventId,
            travelId: activeRatMinigame.travelId,
            result: result.result,
            hits: result.hits,
            requiredHits: result.requiredHits,
            remainingSeconds: result.remainingSeconds,
            timeLimitSeconds: result.timeLimitSeconds,
        });

        window.__activeRatEventId = undefined;
        setActiveRatMinigame(null);
        const id = `rat-result-${Date.now()}`;
        const success = result.result === "SUCCESS";
        setRatResultToasts(prev => [...prev, {
            id,
            success,
            message: success ? "Ratten-Event erfolgreich" : "Ratten-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setRatResultToasts(prev => prev.filter(toast => toast.id !== id));
        }, 2600);
    }, [activeRatMinigame, submitRatResult]);

    useEffect(() => {
        const hasPendingLoading = assignedCargos.some(
            e => e.phase === "loading" && !e.loadingDone
        );
        if (!hasPendingLoading) return;

        const interval = setInterval(() => {
            setAssignedCargos(prev => {
                let changed = false;
                const next = prev.map(entry => {
                    if (entry.phase !== "loading" || entry.loadingDone) return entry;
                    const elapsed = (Date.now() - entry.loadingStartedAt) / 1000;
                    if (elapsed >= entry.loadingDurationSeconds) {
                        changed = true;
                        return { ...entry, loadingDone: true };
                    }
                    return entry;
                });
                return changed ? next : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [assignedCargos]);

    const handleSessionUpdate = useCallback(() => {}, []);

    const { isConnected, stompClient } = useGameSessionWebSocket({
        sessionId,
        onSessionUpdate: handleSessionUpdate,
    });

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        fetch('/api/ports', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(ports => {
                window.__latestPorts = ports;
                window.dispatchEvent(new CustomEvent('backend-ports', { detail: ports }));
            })
            .catch(err => console.error('Failed to load ports:', err));
    }, []);

    useEffect(() => {
        if (!playerId || !sessionId) return;
        const token = localStorage.getItem('auth_token') ?? '';
        fetch(`/api/sessions/${sessionId}/players/${playerId}/home-port`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((data: { homePortId?: string }) => {
                if (data.homePortId) {
                    window.__homePortId = data.homePortId;
                }
            })
            .catch(err => console.warn('Failed to load home port:', err));
    }, [playerId, sessionId]);

    const send = useCallback((message: object) => {
        if (!stompClient?.connected) return;
        stompClient.send('/app/game', {}, JSON.stringify(message));
    }, [stompClient]);

    return (
        <div className={`app-layout ${view}`}>
            <div className="top"><TopBar /></div>
            <div className="game"><Game view={view} /></div>
            <div className={`fullscreen-overlay ${
                (view === "harbor" || view === "broker" || view === "cargoManagement" || view === "office") ? "open" : "closed"
            }`}>
                {view === "harbor" && (
                    <HarborScene
                        onClose={() => setView("map")}
                        onCargoAssigned={handleCargoAssigned}
                    />
                )}
                {view === "broker" && <ShipBrokerScene onClose={() => setView("map")} />}
                {view === "office" && <OfficeScene onClose={() => setView("map")} />}
                {view === "cargoManagement" && (
                    <CargoManagementScreen
                        assignedCargos={assignedCargos}
                        onCargoLoadingDone={handleCargoCompleted}
                        onCargoRemoved={handleCargoRemoved}
                        onCargoPhaseChange={handleCargoPhaseChange}
                        onClose={() => setView("map")}
                        onDepartureStarted={handleDepartureStarted}
                        onDepartureComplete={handleDepartureComplete}
                    />
                )}
            </div>
            {view === "portProfile" && selectedPort && (
                <PortProfileScreen port={selectedPort} onClose={() => setView("map")} />
            )}
            {(view === "map" || view === "portProfile") && (
                <div className="sidebar">
                    <SideBar
                        currentView={view}
                        onOpenOffice={() => setView("office")}
                        onStartAction={() => setView("harbor")}
                        onOpenBroker={() => setView("broker")}
                        onOpenCargoManagement={() => setView("cargoManagement")}
                        assignedCargoCount={assignedCargos.length}
                    />
                </div>
            )}
            {(view === "map" || view === "portProfile") && (
                <div className="bottom">
                    <BottomBar send={send} connected={isConnected} />
                </div>
            )}

            {rewardToasts.map(toast => (
                <RewardToast
                    key={toast.id}
                    shipName={toast.shipName}
                    from={toast.from}
                    to={toast.to}
                    reward={toast.reward}
                    onDismiss={() => setRewardToasts(prev => prev.filter(t => t.id !== toast.id))}
                />
            ))}

            {ratResultToasts.map((toast, index) => (
                <div
                    key={toast.id}
                    style={{
                        position: "fixed",
                        right: 20,
                        bottom: 110 + index * 74,
                        zIndex: 1002,
                        minWidth: 280,
                        maxWidth: 380,
                        background: toast.success ? "#e7f6ea" : "#ffe7e7",
                        border: `3px solid ${toast.success ? "#2f7a45" : "#a23f3f"}`,
                        borderRadius: 8,
                        boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                        padding: "10px 12px",
                        color: toast.success ? "#1f5e35" : "#7d2a2a",
                        fontWeight: 700,
                    }}
                >
                    {toast.success ? "✅ " : "⚠️ "}
                    {toast.message}
                </div>
            ))}

            {customsToasts.map((toast, index) => (
                <CustomsResultToast
                    key={toast.id}
                    kind={toast.kind}
                    shipName={toast.shipName}
                    from={toast.from}
                    to={toast.to}
                    bottomOffset={60 + index * 42}
                    onDismiss={() => setCustomsToasts(prev => prev.filter(t => t.id !== toast.id))}
                />
            ))}

            {smuggleOffer && (
                <SmuggleOfferDialog
                    offerId={smuggleOffer.offerId}
                    portId={smuggleOffer.portId}
                    reward={smuggleOffer.reward}
                    cargoDescription={smuggleOffer.cargoDescription}
                    onAccept={handleSmuggleAccept}
                    onDecline={handleSmuggleDecline}
                />
            )}

            {customsInspection && (
                <CustomsInspectionDialog
                    inspectionId={customsInspection.inspectionId}
                    travelId={customsInspection.travelId}
                    shipName={customsInspection.shipName}
                    originPortName={customsInspection.originPortName}
                    destinationPortName={customsInspection.destinationPortName}
                    fineAmount={customsInspection.fineAmount}
                    bribeCost={customsInspection.bribeCost}
                    detentionTicks={customsInspection.detentionTicks}
                    illegalCargoLabels={customsInspection.illegalCargoLabels}
                    onCooperate={handleCustomsCooperate}
                    onBribe={handleCustomsBribe}
                    onDismiss={handleCustomsDismiss}
                />
            )}

            {ratEventOffer && (
                <EventNotificationDialog
                    title="Event: Rattenbefall"
                    successText="Wenn du das Event schaffst, werden die Ratten abgewehrt und die Fracht bleibt unbeschädigt."
                    failText="Wenn du das Event nicht schaffst oder ablehnst, wird das Minispiel als nicht bestanden gewertet und ein Teil der Fracht geht verloren."
                    imageSrc={ratImage}
                    imageAlt="Ratte"
                    onAccept={handleRatEventAccept}
                    onDecline={handleRatEventDecline}
                />
            )}

            {activeRatMinigame && (
                <RatMinigameOverlay
                    config={{
                        eventId: activeRatMinigame.eventId,
                        travelId: activeRatMinigame.travelId,
                        timeLimitSeconds: activeRatMinigame.timeLimitSeconds,
                        requiredHits: activeRatMinigame.requiredHits,
                    }}
                    onFinished={handleRatMinigameFinished}
                />
            )}
        </div>
    );
}