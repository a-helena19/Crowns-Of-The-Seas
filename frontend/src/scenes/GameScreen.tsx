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
import DockingMiniGame from "../scenes/DockingMiniGame";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import RewardToast from "../components/RewardToast.tsx";
import MinigameStatusToast from "../components/MinigameStatusToast.tsx";
import SmuggleOfferDialog from "../components/SmuggleOfferDialog.tsx";
import RatMinigameOverlay from "../minigame/rats/RatMinigameOverlay.tsx";
import type { RatMinigameEventPayload, RatMinigameResult } from "../minigame/rats/RatMinigameTypes.ts";
import StormMinigameOverlay from "../minigame/storm/StormMinigameOverlay.tsx";
import type { StormMinigameEventPayload, StormMinigameResult } from "../minigame/storm/StormMinigameTypes.ts";
import { minigameSessionManager } from "../minigame/MinigameSessionManager.ts";
import EventNotificationDialog from "../components/EventNotificationDialog.tsx";
import ratImage from "../assets/Rat.png";
import stormDialogImage from "../assets/minigame/storm/DialogPic.png";
import GameOverScreen from "../components/GameOverScreen";

export const TOP_BAR_HEIGHT = '9vh';
export const BOTTOM_BAR_HEIGHT = '20vh';

export default function GameScreen() {
    const [view, setView] = useState<"map" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office">("map");
    const viewRef = useRef(view);
    const [selectedPort, setSelectedPort] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const tickRateSeconds: number = sessionData ? (JSON.parse(sessionData).tickRateSeconds ?? 30) : 30;

    const userData = localStorage.getItem('crowns_user');
    const playerId: string | null = userData ? JSON.parse(userData).id : null;

    const [gameOver, setGameOver] = useState(false);

    const [assignedCargos, setAssignedCargos] = useState<AssignedCargoEntry[]>([]);
    const [rewardToasts, setRewardToasts] = useState<{
        id: string; shipName: string; from: string; to: string; reward: number;
    }[]>([]);
    const [minigameStatusToasts, setMinigameStatusToasts] = useState<{
        id: string;
        success: boolean;
        message: string;
        title: string;
    }[]>([]);
    const [smuggleOffer, setSmuggleOffer] = useState<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const [ratEventOffer, setRatEventOffer] = useState<RatMinigameEventPayload | null>(null);
    const [activeRatMinigame, setActiveRatMinigame] = useState<RatMinigameEventPayload | null>(null);
    const [stormEventOffer, setStormEventOffer] = useState<StormMinigameEventPayload | null>(null);
    const [activeStormMinigame, setActiveStormMinigame] = useState<StormMinigameEventPayload | null>(null);

    const pendingSmuggleRef = useRef<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const departureActiveRef = useRef(false);
    const arrivedMiniGameShown = useRef<Set<string>>(new Set());
    const [showArrivalDocking, setShowArrivalDocking] = useState<AssignedCargoEntry | null>(null);
    const [activePilotStrikes, setActivePilotStrikes] = useState<Record<string, { portName: string }>>({});
    const [strikeNotice, setStrikeNotice] = useState<string | null>(null);

    const authToken = localStorage.getItem("auth_token") ?? "";

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

    function handleTravelStarted(cargoId: string, pilotageUsed: boolean, pilotageStrikeRevoked?: boolean) {
        setAssignedCargos(prev => prev.map(e =>
            e.cargoId === cargoId
                ? { ...e, pilotageUsed, ...(pilotageStrikeRevoked != null ? { pilotageStrikeRevoked } : {}) }
                : e
        ));
    }

    useEffect(() => {
        if (!sessionId || !authToken) return;
        fetch(`/api/sessions/${sessionId}/pilot-strikes`, {
            headers: { Authorization: `Bearer ${authToken}` },
        })
            .then(r => (r.ok ? r.json() : []))
            .then((strikes: { portId: string; portName: string }[]) => {
                const map: Record<string, { portName: string }> = {};
                for (const s of strikes) {
                    map[s.portId] = { portName: s.portName };
                }
                setActivePilotStrikes(map);
            })
            .catch(() => { /* noop */ });
    }, [sessionId, authToken]);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{
                eventType: string;
                portId: string;
                portName: string;
                endTick?: number;
                revokedTravels?: { travelId: string; playerId: string }[];
            }>).detail;

            if (detail.eventType === "PILOT_STRIKE_STARTED") {
                setActivePilotStrikes(prev => ({
                    ...prev,
                    [detail.portId]: { portName: detail.portName },
                }));
                const myRevoked = detail.revokedTravels?.filter(r => r.playerId === playerId) ?? [];
                if (myRevoked.length > 0) {
                    setStrikeNotice(
                        `Lotsenstreik in ${detail.portName}! Du musst selbst anlegen. Die Lotsengebühr wird beim Reiseabschluss erstattet.`
                    );
                    setAssignedCargos(prev => prev.map(entry => {
                        if (!myRevoked.some(r => r.travelId === entry.travelId)) return entry;
                        return { ...entry, pilotageStrikeRevoked: true };
                    }));
                }
            } else if (detail.eventType === "PILOT_STRIKE_ENDED") {
                setActivePilotStrikes(prev => {
                    const next = { ...prev };
                    delete next[detail.portId];
                    return next;
                });
            }
        };
        window.addEventListener("pilot-strike-update", handler);
        return () => window.removeEventListener("pilot-strike-update", handler);
    }, [playerId]);

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

    // Ship positions → update cargo entries with tick data + paused state
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
                if (entry.phase !== "en_route" && entry.phase !== "unloading") return entry;
                const ship = detail.ships.find(s => s.playerShipId === entry.shipId);
                if (!ship) return entry;
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

    // Ankunfts-Minispiel automatisch starten (Vollbild über der Karte)
    useEffect(() => {
        if (showArrivalDocking) return;
        for (const entry of assignedCargos) {
            if (
                entry.phase === "unloading" &&
                entry.travelId &&
                (!entry.pilotageUsed || entry.pilotageStrikeRevoked) &&
                !arrivedMiniGameShown.current.has(entry.travelId)
            ) {
                arrivedMiniGameShown.current.add(entry.travelId);
                setShowArrivalDocking(entry);
                break;
            }
        }
    }, [assignedCargos, showArrivalDocking]);

    const handleArrivalDockingSuccess = useCallback(() => {
        setShowArrivalDocking(null);
    }, []);

    const handleArrivalDockingFailure = useCallback(async () => {
        const entry = showArrivalDocking;
        setShowArrivalDocking(null);
        if (!entry?.travelId || !playerId || !sessionId) return;
        try {
            await fetch(
                `/api/travels/${entry.travelId}/docking-failed?playerId=${playerId}&sessionId=${sessionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${authToken}` } }
            );
            window.dispatchEvent(new CustomEvent("player-balance-updated"));
        } catch { /* nicht-fatal */ }
    }, [showArrivalDocking, playerId, sessionId, authToken]);

    // Travel complete → reward
    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<{
                travelId: string;
                playerId: string;
                totalReward: number;
                baseReward: number;
                dockingFine?: number;
                departureDockingFine?: number;
                pilotageRefund?: number;
                cargoRewards: { cargoId: string; cargoName: string; destinationPort: string; baseReward: number; bonusReward: number; actualReward: number; percentage: number; status: string; cargoType: string }[];
                ratMinigameSummary?: {
                    triggered: boolean;
                    result?: "SUCCESS" | "FAILED";
                    penaltyAmount?: number;
                };
                stormMinigameSummary?: {
                    triggered: boolean;
                    result?: "SUCCESS" | "FAILED";
                    penaltyAmount?: number;
                    cargoLossPercent?: number;
                    conditionDamagePercent?: number;
                };
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
                        dockingFine: data.dockingFine ?? 0,
                        departureDockingFine: data.departureDockingFine ?? 0,
                        pilotageRefund: data.pilotageRefund ?? 0,
                        rewardDetails: firstCargo
                            ? {
                                baseReward: firstCargo.baseReward,
                                actualReward: firstCargo.actualReward,
                                percentage: firstCargo.percentage
                            }
                            : undefined,
                        cargoRewards: data.cargoRewards,
                        ratMinigameSummary: data.ratMinigameSummary,
                        stormMinigameSummary: data.stormMinigameSummary,
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

    // Game Over Erkennung
    useEffect(() => {
        const handleTick = (e: Event) => {
            const { currentTick, totalTicks } = (e as CustomEvent<{
                currentTick: number;
                totalTicks: number;
            }>).detail;

            if (currentTick >= totalTicks && totalTicks > 0) {
                // Kurze Verzögerung damit der letzte Tick noch angezeigt wird
                setTimeout(() => setGameOver(true), 500);
            }
        };

        window.addEventListener("backend-tick", handleTick);
        return () => window.removeEventListener("backend-tick", handleTick);
    }, []);

    // Smuggle offer
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

    // Rat minigame event
    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<RatMinigameEventPayload>).detail;
            if (data.playerId !== playerId) return;
            if (window.__activeRatEventId === data.eventId) return;
            window.__activeRatEventId = data.eventId;
            minigameSessionManager.startSession({
                minigameType: data.eventType,
                eventId: data.eventId,
                playerId: data.playerId,
                playerShipId: data.playerShipId,
                travelId: data.travelId,
            });
            setRatEventOffer(data);
        };

        window.addEventListener("rats-event", handler);
        return () => window.removeEventListener("rats-event", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<StormMinigameEventPayload>).detail;
            if (data.playerId !== playerId) return;
            if (window.__activeStormEventId === data.eventId) return;
            window.__activeStormEventId = data.eventId;
            const shipIconUrl = window.__latestShips?.find(s => s.playerShipId === data.playerShipId)?.iconUrl;
            minigameSessionManager.startSession({
                minigameType: data.eventType,
                eventId: data.eventId,
                playerId: data.playerId,
                playerShipId: data.playerShipId,
                travelId: data.travelId,
            });
            setStormEventOffer({ ...data, shipIconUrl });
        };

        window.addEventListener("storm-event", handler);
        return () => window.removeEventListener("storm-event", handler);
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

        minigameSessionManager.finishSession(ratEventOffer.eventId, "DECLINED");
        window.__activeRatEventId = undefined;
        setRatEventOffer(null);
        const id = `rat-result-${Date.now()}`;
        setMinigameStatusToasts(prev => [...prev, {
            id,
            success: false,
            title: "Ratten-Event",
            message: "Ratten-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== id));
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

        minigameSessionManager.finishSession(activeRatMinigame.eventId, "COMPLETED");
        window.__activeRatEventId = undefined;
        setActiveRatMinigame(null);
        const id = `rat-result-${Date.now()}`;
        const success = result.result === "SUCCESS";
        setMinigameStatusToasts(prev => [...prev, {
            id,
            success,
            title: "Ratten-Event",
            message: success ? "Ratten-Event erfolgreich" : "Ratten-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== id));
        }, 2600);
    }, [activeRatMinigame, submitRatResult]);

    const submitStormResult = useCallback(async (payload: {
        eventId: string;
        travelId: string;
        result: "SUCCESS" | "FAILED";
        collectedSuns: number;
        requiredSuns: number;
        remainingHealth: number;
        timeLeftSeconds: number;
        timeLimitSeconds: number;
    }) => {
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            const res = await fetch(`/api/minigames/storm/result?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }, [playerId, sessionId]);


    const handleStormEventAccept = useCallback(() => {
        if (!stormEventOffer) return;
        setActiveStormMinigame(stormEventOffer);
        setStormEventOffer(null);
    }, [stormEventOffer]);

    const handleStormEventDecline = useCallback(async () => {
        if (!stormEventOffer) return;
        const survivedWithoutDamage = Math.random() < 0.5;
        const result = survivedWithoutDamage ? "SUCCESS" : "FAILED";

        await submitStormResult({
            eventId: stormEventOffer.eventId,
            travelId: stormEventOffer.travelId,
            result,
            collectedSuns: 0,
            requiredSuns: stormEventOffer.requiredSuns,
            remainingHealth: stormEventOffer.startHealth,
            timeLeftSeconds: 0,
            timeLimitSeconds: stormEventOffer.timeLimitSeconds,
        });

        const statusId = `storm-decline-result-${Date.now()}`;
        const success = result === "SUCCESS";
        setMinigameStatusToasts(prev => [...prev, {
            id: statusId,
            success,
            title: "Sturm-Event",
            message: success
                ? "Sturm-Event trotz Ablehnung erfolgreich überstanden"
                : "Sturm-Event nach Ablehnung fehlgeschlagen",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== statusId));
        }, 2600);

        minigameSessionManager.finishSession(stormEventOffer.eventId, "DECLINED");
        window.__activeStormEventId = undefined;
        setStormEventOffer(null);
    }, [stormEventOffer, submitStormResult]);

    const handleStormMinigameFinished = useCallback(async (result: StormMinigameResult) => {
        if (!activeStormMinigame) return;

        await submitStormResult({
            eventId: activeStormMinigame.eventId,
            travelId: activeStormMinigame.travelId,
            result: result.result,
            collectedSuns: result.collectedSuns,
            requiredSuns: result.requiredSuns,
            remainingHealth: result.remainingHealth,
            timeLeftSeconds: result.timeLeftSeconds,
            timeLimitSeconds: result.timeLimitSeconds,
        });

        if (result.result === "SUCCESS") {
            const id = `storm-result-${Date.now()}`;
            setMinigameStatusToasts(prev => [...prev, {
                id,
                success: true,
                title: "Sturm-Event",
                message: "Sturm-Event erfolgreich bestanden",
            }]);
            setTimeout(() => {
                setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== id));
            }, 2600);
            minigameSessionManager.finishSession(activeStormMinigame.eventId, "COMPLETED");
            window.__activeStormEventId = undefined;
            setActiveStormMinigame(null);
            return;
        }

        const id = `storm-result-${Date.now()}`;
        setMinigameStatusToasts(prev => [...prev, {
            id,
            success: false,
            title: "Sturm-Event",
            message: "Sturm-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== id));
        }, 2600);

        minigameSessionManager.finishSession(activeStormMinigame.eventId, "COMPLETED");
        window.__activeStormEventId = undefined;
        setActiveStormMinigame(null);
    }, [activeStormMinigame, submitStormResult]);

    // Auto-complete loading phase
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

    const handleSessionUpdate = useCallback((event: { type?: string; status?: string }) => {
        if (event.status === "FINISHED" || event.type === "GAME_FINISHED") {
            setTimeout(() => setGameOver(true), 500);
        }
    }, []);

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

    // Heimathafen beim Game-Start laden
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
                        activePilotStrikes={activePilotStrikes}
                        onCargoLoadingDone={handleCargoCompleted}
                        onCargoRemoved={handleCargoRemoved}
                        onCargoPhaseChange={handleCargoPhaseChange}
                        onTravelStarted={handleTravelStarted}
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

            {minigameStatusToasts.map((toast) => (
                <MinigameStatusToast
                    key={toast.id}
                    title={toast.title}
                    message={toast.message}
                    success={toast.success}
                    onDismiss={() => setMinigameStatusToasts(prev => prev.filter(t => t.id !== toast.id))}
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

            {gameOver && sessionId && (
                <GameOverScreen
                    sessionId={sessionId}
                    currentUserId={playerId}
                />
            )}

            {strikeNotice && (
                <div className="pilot-strike-banner">
                    {strikeNotice}
                    <button
                        type="button"
                        onClick={() => setStrikeNotice(null)}
                        style={{
                            marginLeft: 12,
                            background: "transparent",
                            border: "none",
                            color: "#fadbd8",
                            cursor: "pointer",
                            fontSize: 16,
                        }}
                        aria-label="Schließen"
                    >
                        ×
                    </button>
                </div>
            )}

            {showArrivalDocking && (
                <DockingMiniGame
                    mode="arrival"
                    shipIconUrl={showArrivalDocking.shipIconUrl ?? "/fallback-ship.png"}
                    portName={showArrivalDocking.to}
                    onSuccess={handleArrivalDockingSuccess}
                    onFailure={handleArrivalDockingFailure}
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

            {stormEventOffer && (
                <EventNotificationDialog
                    title="Event: Schwerer Sturm"
                    successText="Wenn du genug Sonnen einsammelst, beruhigt sich der Sturm und die Route geht normal weiter."
                    failText="Wenn du ablehnst, gibt es eine 50/50 Chance den Sturm unbeschadet zu überleben. Bei Misserfolg verliert das Schiff 50% Zustand und ungefähr die Hälfte der geladenen Fracht geht verloren."
                    imageSrc={stormDialogImage}
                    imageAlt="Sturm"
                    onAccept={handleStormEventAccept}
                    onDecline={handleStormEventDecline}
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

            {activeStormMinigame && (
                <StormMinigameOverlay
                    config={{
                        eventId: activeStormMinigame.eventId,
                        travelId: activeStormMinigame.travelId,
                        timeLimitSeconds: activeStormMinigame.timeLimitSeconds,
                        requiredSuns: activeStormMinigame.requiredSuns,
                        startHealth: activeStormMinigame.startHealth,
                        shipIconUrl: activeStormMinigame.shipIconUrl,
                    }}
                    onFinished={handleStormMinigameFinished}
                />
            )}

        </div>
    );
}
