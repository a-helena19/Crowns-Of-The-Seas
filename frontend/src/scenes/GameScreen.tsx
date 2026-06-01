import { useEffect, useCallback, useState, useRef } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";
import OfficeScene from "../scenes/OfficeScene.tsx";
import PortProfileScreen from "../scenes/PortProfileScreen.tsx";
import MarketplaceScene from "./MarketplaceScene.tsx";
import { useGameSessionWebSocket } from "../hooks/useGameSessionWebSocket.ts";
import CargoManagementScreen from "../scenes/CargoManagementScreen";
import DockingMiniGame from "../scenes/DockingMiniGame";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import RewardToast from "../components/RewardToast.tsx";
import MinigameStatusToast from "../components/MinigameStatusToast.tsx";
import SmuggleOfferDialog from "../components/SmuggleOfferDialog.tsx";
import CustomsInspectionDialog from "../components/CustomsInspectionDialog.tsx";
import CustomsResultToast, { type CustomsToastKind } from "../components/CustomsResultToast.tsx";
import RatMinigameOverlay from "../minigame/rats/RatMinigameOverlay.tsx";
import type { RatMinigameEventPayload, RatMinigameResult } from "../minigame/rats/RatMinigameTypes.ts";
import StormMinigameOverlay from "../minigame/storm/StormMinigameOverlay.tsx";
import type { StormMinigameEventPayload, StormMinigameResult } from "../minigame/storm/StormMinigameTypes.ts";
import ObstacleMinigameOverlay from "../minigame/obstacle/ObstacleMinigameOverlay.tsx";
import type { ObstacleMinigameEventPayload, ObstacleMinigameResult } from "../minigame/obstacle/ObstacleMinigameTypes.ts";
import { ObstacleRouteViewResolver } from "../minigame/obstacle/ObstacleRouteViewResolver.ts";
import { minigameSessionManager } from "../minigame/MinigameSessionManager.ts";
import EventNotificationDialog from "../components/EventNotificationDialog.tsx";
import ratImage from "../assets/Rat.png";
import stormDialogImage from "../assets/minigame/storm/DialogPic.png";
import obstacleDialogImage from "../assets/minigame/obstaclegame/wrack.png";
import GameOverScreen from "../components/GameOverScreen";
import audioEngine from '../audio/AudioEngine';

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

interface OwnedShipSummary {
    id: string;
    name: string;
    shipClass?: string;
    iconUrl: string;
    status: string;
    fuel: number;
    condition: number;
    currentPortId?: string;
}

interface PendingShipEvent {
    eventId: string;
    label: string;
    kind: "rats" | "storm" | "obstacle" | "arrival_docking";
}

export default function GameScreen() {
    const [view, setView] = useState<"map" | "marketplace" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office">("map");
    const [marketplaceReturnView, setMarketplaceReturnView] = useState<"map" | "portProfile">("map");
    const [overlayReturnView, setOverlayReturnView] = useState<"map" | "marketplace">("map");
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
    const [customsToasts, setCustomsToasts] = useState<CustomsToast[]>([]);
    const [smuggleOffer, setSmuggleOffer] = useState<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const [customsInspection, setCustomsInspection] = useState<CustomsInspectionPayload | null>(null);
    const customsQueueRef = useRef<CustomsInspectionPayload[]>([]);
    const [ratEventOffer, setRatEventOffer] = useState<RatMinigameEventPayload | null>(null);
    const [activeRatMinigame, setActiveRatMinigame] = useState<RatMinigameEventPayload | null>(null);
    const [stormEventOffer, setStormEventOffer] = useState<StormMinigameEventPayload | null>(null);
    const [activeStormMinigame, setActiveStormMinigame] = useState<StormMinigameEventPayload | null>(null);
    const [obstacleEventOffer, setObstacleEventOffer] = useState<ObstacleMinigameEventPayload | null>(null);
    const [activeObstacleMinigame, setActiveObstacleMinigame] = useState<ObstacleMinigameEventPayload | null>(null);
    const [openedEventId, setOpenedEventId] = useState<string | null>(null);

    const pendingSmuggleRef = useRef<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);
    const departureActiveRef = useRef(false);
    const arrivedMiniGameShown = useRef<Set<string>>(new Set());
    const [showArrivalDocking, setShowArrivalDocking] = useState<AssignedCargoEntry | null>(null);
    const [pendingArrivalDocking, setPendingArrivalDocking] = useState<AssignedCargoEntry | null>(null);
    const [activePilotStrikes, setActivePilotStrikes] = useState<Record<string, { portName: string }>>({});
    const [strikeNotice, setStrikeNotice] = useState<string | null>(null);
    const [leftNotice, setLeftNotice] = useState<string | null>(null);
    const [ownedShips, setOwnedShips] = useState<OwnedShipSummary[]>([]);
    const ownedShipsRef = useRef<OwnedShipSummary[]>([]);
    const [focusShipIdForCargoManagement, setFocusShipIdForCargoManagement] = useState<string | null>(null);
    const [openCargoForShipId, setOpenCargoForShipId] = useState<string | null>(null);

    const authToken = localStorage.getItem("auth_token") ?? "";

    const loadOwnedShips = useCallback(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        })
            .then(res => (res.ok ? res.json() : []))
            .then((ships: any[]) => {
                setOwnedShips(
                    ships.map((ship) => ({
                        id: ship.id,
                        name: ship.name,
                        shipClass: ship.shipClass,
                        iconUrl: ship.iconUrl,
                        status: ship.status,
                        fuel: ship.fuel,
                        condition: ship.condition,
                        currentPortId: ship.currentPortId,
                    }))
                );
            })
            .catch(() => {});
    }, [playerId, sessionId, authToken]);

    useEffect(() => {
        loadOwnedShips();
    }, [loadOwnedShips]);

    useEffect(() => {
        ownedShipsRef.current = ownedShips;
    }, [ownedShips]);

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
                    audioEngine.playSfx('notification');
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
                    && entry.phase !== "awaiting_docking"
                    && entry.phase !== "customs_check"
                    && entry.phase !== "blocked"
                    && entry.phase !== "unloading") return entry;
                const ship = detail.ships.find(s => s.playerShipId === entry.shipId);
                if (!ship) return entry;
                if (ship.status === "AWAITING_DOCKING") {
                    return {
                        ...entry,
                        phase: "awaiting_docking",
                        currentTick: detail.currentTick,
                        paused: false,
                    };
                }
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

            const wsShips = detail.ships ?? [];
            const previousShips = ownedShipsRef.current;
            const hasUnknownShip = wsShips.some(ws => !previousShips.some(ship => ship.id === ws.playerShipId));
            const shouldRefreshShipDetails = wsShips.some(ws => {
                const prev = previousShips.find(ship => ship.id === ws.playerShipId);
                if (!prev) return false;
                return (prev.status === "REFUELING" || prev.status === "REPAIRING") && ws.status === "AT_PORT";
            });

            setOwnedShips(prev => prev.map(ship => {
                const wsShip = wsShips.find(s => s.playerShipId === ship.id);
                if (!wsShip) return ship;
                return {
                    ...ship,
                    status: wsShip.status ?? ship.status,
                    currentPortId: wsShip.currentPortId ?? ship.currentPortId,
                };
            }));

            if (hasUnknownShip || shouldRefreshShipDetails) {
                loadOwnedShips();
            }
        };
        window.addEventListener("backend-ship-positions", handler);
        return () => window.removeEventListener("backend-ship-positions", handler);
    }, [loadOwnedShips]);

    useEffect(() => {
        if (view === "map" || view === "portProfile") {
            loadOwnedShips();
        }
    }, [view, loadOwnedShips]);

    // Ankunfts-Minispiel automatisch starten (Vollbild über der Karte)
    // Ankunfts-Minispiel automatisch starten (Vollbild über der Karte)
    useEffect(() => {
        if (showArrivalDocking || pendingArrivalDocking) return;
        for (const entry of assignedCargos) {
            if (
                entry.phase === "awaiting_docking" &&
                entry.travelId &&
                !arrivedMiniGameShown.current.has(entry.travelId)
            ) {
                arrivedMiniGameShown.current.add(entry.travelId);
                setPendingArrivalDocking(entry);
                break;
            }
        }
    }, [assignedCargos, showArrivalDocking, pendingArrivalDocking]);

    const handleArrivalDockingSuccess = useCallback(async () => {
        const entry = showArrivalDocking;
        setShowArrivalDocking(null);
        setPendingArrivalDocking(null);
        if (!entry?.travelId || !playerId || !sessionId) return;
        try {
            await fetch(
                `/api/travels/${entry.travelId}/docking-success?playerId=${playerId}&sessionId=${sessionId}`,
                { method: "POST", headers: { Authorization: `Bearer ${authToken}` } }
            );
        } catch { /* nicht-fatal */ }
    }, [showArrivalDocking, playerId, sessionId, authToken]);

    const handleArrivalDockingFailure = useCallback(async () => {
        const entry = showArrivalDocking;
        setShowArrivalDocking(null);
        setPendingArrivalDocking(null);
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
                obstacleMinigameSummary?: {
                    triggered: boolean;
                    result?: "SUCCESS" | "FAILED";
                    penaltyAmount?: number;
                    cargoLossPercent?: number;
                    conditionDamagePercent?: number;
                    failureReason?: string;
                    routeViewType?: "VIEW_A" | "VIEW_B";
                };
            }>).detail;
            if (data.playerId !== playerId) return;

            audioEngine.playSfx('coinReward');

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
                        customsSummary: data.customsSummary ?? undefined,
                        regressSummary: data.regressSummary ?? undefined,
                        ratMinigameSummary: data.ratMinigameSummary,
                        stormMinigameSummary: data.stormMinigameSummary,
                        obstacleMinigameSummary: data.obstacleMinigameSummary,
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
            audioEngine.playSfx('smuggleNotification');
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

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<ObstacleMinigameEventPayload>).detail;
            if (data.playerId !== playerId) return;
            if (window.__activeObstacleEventId === data.eventId) return;
            window.__activeObstacleEventId = data.eventId;
            const shipIconUrl = window.__latestShips?.find(s => s.playerShipId === data.playerShipId)?.iconUrl;
            const routeViewType = ObstacleRouteViewResolver.resolve(data);
            minigameSessionManager.startSession({
                minigameType: data.eventType,
                eventId: data.eventId,
                playerId: data.playerId,
                playerShipId: data.playerShipId,
                travelId: data.travelId,
            });
            setObstacleEventOffer({ ...data, shipIconUrl, routeViewType });
        };

        window.addEventListener("obstacle-event", handler);
        return () => window.removeEventListener("obstacle-event", handler);
    }, [playerId]);

    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<CustomsInspectionPayload>).detail;
            if (data.playerId !== playerId) return;
            audioEngine.playSfx('notification');
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
            audioEngine.playSfx('notification');
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
        setOpenedEventId(null);
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
        setOpenedEventId(null);
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
        setOpenedEventId(null);
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
        setOpenedEventId(null);
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

    const submitObstacleResult = useCallback(async (payload: {
        eventId: string;
        travelId: string;
        result: "SUCCESS" | "FAILED";
        remainingHealth: number;
        timeLeftSeconds: number;
        timeLimitSeconds: number;
        failureReason?: string;
        routeViewType: "VIEW_A" | "VIEW_B";
    }) => {
        const token = localStorage.getItem("auth_token") ?? "";
        try {
            const res = await fetch(`/api/minigames/obstacle/result?playerId=${playerId}&sessionId=${sessionId}`, {
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

    const handleObstacleEventAccept = useCallback(() => {
        if (!obstacleEventOffer) return;
        setActiveObstacleMinigame(obstacleEventOffer);
        setObstacleEventOffer(null);
        setOpenedEventId(null);
    }, [obstacleEventOffer]);

    const handleObstacleEventDecline = useCallback(async () => {
        if (!obstacleEventOffer) return;
        const survivedWithoutDamage = Math.random() < 0.5;
        const result = survivedWithoutDamage ? "SUCCESS" : "FAILED";
        const routeViewType = ObstacleRouteViewResolver.resolve(obstacleEventOffer);

        await submitObstacleResult({
            eventId: obstacleEventOffer.eventId,
            travelId: obstacleEventOffer.travelId,
            result,
            remainingHealth: obstacleEventOffer.startHealth,
            timeLeftSeconds: 0,
            timeLimitSeconds: obstacleEventOffer.timeLimitSeconds,
            failureReason: result === "FAILED" ? "DECLINED" : undefined,
            routeViewType,
        });

        const statusId = `obstacle-decline-result-${Date.now()}`;
        const success = result === "SUCCESS";
        setMinigameStatusToasts(prev => [...prev, {
            id: statusId,
            success,
            title: "Hindernis-Event",
            message: success
                ? "Hindernis-Event trotz Ablehnung erfolgreich überstanden"
                : "Hindernis-Event nach Ablehnung fehlgeschlagen",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== statusId));
        }, 2600);

        minigameSessionManager.finishSession(obstacleEventOffer.eventId, "DECLINED");
        window.__activeObstacleEventId = undefined;
        setObstacleEventOffer(null);
        setOpenedEventId(null);
    }, [obstacleEventOffer, submitObstacleResult]);

    const handleObstacleMinigameFinished = useCallback(async (result: ObstacleMinigameResult) => {
        if (!activeObstacleMinigame) return;

        await submitObstacleResult({
            eventId: activeObstacleMinigame.eventId,
            travelId: activeObstacleMinigame.travelId,
            result: result.result,
            remainingHealth: result.remainingHealth,
            timeLeftSeconds: result.timeLeftSeconds,
            timeLimitSeconds: result.timeLimitSeconds,
            failureReason: result.failureReason,
            routeViewType: result.routeViewType,
        });

        const id = `obstacle-result-${Date.now()}`;
        const success = result.result === "SUCCESS";
        setMinigameStatusToasts(prev => [...prev, {
            id,
            success,
            title: "Hindernis-Event",
            message: success ? "Hindernis-Event erfolgreich bestanden" : "Hindernis-Event nicht bestanden",
        }]);
        setTimeout(() => {
            setMinigameStatusToasts(prev => prev.filter(toast => toast.id !== id));
        }, 2600);

        minigameSessionManager.finishSession(activeObstacleMinigame.eventId, "COMPLETED");
        window.__activeObstacleEventId = undefined;
        setActiveObstacleMinigame(null);
    }, [activeObstacleMinigame, submitObstacleResult]);

    // Auto-complete loading phase
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

    const handleSessionUpdate = useCallback((event: { type?: string; status?: string; affectedPlayerName?: string }) => {
        if (event.status === "FINISHED" || event.type === "GAME_FINISHED") {
            audioEngine.playSfx('gameOver');
            audioEngine.fadeOutMusic(2000);
            setTimeout(() => setGameOver(true), 500);
            return;
        }

        if (event.type === "PLAYER_LEFT") {
            const name = event.affectedPlayerName?.trim();
            setLeftNotice(name ? `${name} hat die Session verlassen.` : "Ein Mitspieler hat die Session verlassen.");
            audioEngine.playSfx('buttonClick');
            setTimeout(() => setLeftNotice(null), 6000);
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

    useEffect(() => {
        audioEngine.playMusic('game');
        return () => {
            audioEngine.stopMusic();
        };
    }, []);

    const send = useCallback((message: object) => {
        if (!stompClient?.connected) return;
        stompClient.send('/app/game', {}, JSON.stringify(message));
    }, [stompClient]);

    const isMinigameActive = Boolean(
        showArrivalDocking || activeRatMinigame || activeStormMinigame || activeObstacleMinigame
    );

    const pendingEventsByShipId: Record<string, PendingShipEvent> = {};
    if (ratEventOffer) {
        pendingEventsByShipId[ratEventOffer.playerShipId] = {
            eventId: ratEventOffer.eventId,
            label: "Rattenbefall",
            kind: "rats",
        };
    }
    if (stormEventOffer) {
        pendingEventsByShipId[stormEventOffer.playerShipId] = {
            eventId: stormEventOffer.eventId,
            label: "Sturm",
            kind: "storm",
        };
    }
    if (obstacleEventOffer) {
        pendingEventsByShipId[obstacleEventOffer.playerShipId] = {
            eventId: obstacleEventOffer.eventId,
            label: "Gefaehrliche Passage",
            kind: "obstacle",
        };
    }
    if (pendingArrivalDocking && !pendingEventsByShipId[pendingArrivalDocking.shipId]) {
        pendingEventsByShipId[pendingArrivalDocking.shipId] = {
            eventId: pendingArrivalDocking.travelId ?? pendingArrivalDocking.cargoId,
            label: "Manuelles Anlegen",
            kind: "arrival_docking",
        };
    }

    return (
        <div className={`app-layout ${view}`}>
            <div className="top">
                <TopBar />
            </div>
            <div className="game"><Game view={view} /></div>
            <div className={`fullscreen-overlay ${
                (view === "marketplace" || view === "harbor" || view === "broker" || view === "cargoManagement" || view === "office") ? "open" : "closed"
            }`}>
                {view === "marketplace" && (
                    <MarketplaceScene
                        onClose={() => setView(marketplaceReturnView)}
                        onOpenOffice={() => {
                            audioEngine.playSfx('door');
                            setOverlayReturnView("marketplace");
                            setView("office");
                        }}
                        onOpenBroker={() => {
                            audioEngine.playSfx('door');
                            setOverlayReturnView("marketplace");
                            setView("broker");
                        }}
                        onOpenCargoManagement={() => {
                            audioEngine.playSfx('door');
                            setFocusShipIdForCargoManagement(null);
                            setOverlayReturnView("marketplace");
                            setView("cargoManagement");
                        }}
                        onOpenHarbor={() => {
                            audioEngine.playSfx('door');
                            setOverlayReturnView("marketplace");
                            setView("harbor");
                        }}
                    />
                )}
                {view === "harbor" && (
                    <HarborScene
                        onClose={() => {
                            setOpenCargoForShipId(null);
                            setView(overlayReturnView);
                        }}
                        onCargoAssigned={handleCargoAssigned}
                        openCargoForShipId={openCargoForShipId}
                    />
                )}
                {view === "broker" && <ShipBrokerScene onClose={() => setView(overlayReturnView)} />}
                {view === "office" && <OfficeScene onClose={() => setView(overlayReturnView)} />}
                {view === "cargoManagement" && (
                    <CargoManagementScreen
                        assignedCargos={assignedCargos}
                        focusShipId={focusShipIdForCargoManagement}
                        activePilotStrikes={activePilotStrikes}
                        onCargoLoadingDone={handleCargoCompleted}
                        onCargoRemoved={handleCargoRemoved}
                        onCargoPhaseChange={handleCargoPhaseChange}
                        onTravelStarted={handleTravelStarted}
                        onClose={() => setView(overlayReturnView)}
                        onDepartureStarted={handleDepartureStarted}
                        onDepartureComplete={handleDepartureComplete}
                    />
                )}
            </div>
            {view === "portProfile" && selectedPort && (
                <PortProfileScreen port={selectedPort} onClose={() => {setView("map"); audioEngine.playSfx('buttonClick');}} />
            )}
            {(view === "map" || view === "portProfile") && !isMinigameActive && (
                <div className="bottom">
                    <BottomBar
                        send={send}
                        connected={isConnected}
                        ships={ownedShips}
                        pendingEventsByShipId={pendingEventsByShipId}
                        onShipCardClick={(ship) => {
                            audioEngine.playSfx('buttonClick');
                            const pendingEvent = pendingEventsByShipId[ship.id];
                            if (pendingEvent) {
                                if (pendingEvent.kind === "arrival_docking" && pendingArrivalDocking && pendingArrivalDocking.shipId === ship.id) {
                                    setPendingArrivalDocking(null);
                                    setShowArrivalDocking(pendingArrivalDocking);
                                    return;
                                }
                                setOpenedEventId(pendingEvent.eventId);
                                return;
                            }
                            if (ship.status === "AT_PORT") {
                                setOpenCargoForShipId(ship.id);
                                setOverlayReturnView("map");
                                setView("harbor");
                                return;
                            }
                            if (ship.status === "READY_TO_DEPART" || ship.status === "LOADING" || ship.status === "UNLOADING") {
                                setFocusShipIdForCargoManagement(ship.id);
                                setOverlayReturnView("map");
                                setView("cargoManagement");
                            }
                        }}
                        onOpenMarketplace={() => {
                            setOverlayReturnView("map");
                            setMarketplaceReturnView(view === "portProfile" ? "portProfile" : "map");
                            setView("marketplace");
                        }}
                    />
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

            {leftNotice && (
                <div className="pilot-strike-banner" style={{ background: "rgba(30, 41, 59, 0.95)" }}>
                    {leftNotice}
                    <button
                        type="button"
                        onClick={() => setLeftNotice(null)}
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

            {gameOver && sessionId && (
                <GameOverScreen
                    sessionId={sessionId}
                    currentUserId={playerId}
                />
            )}

            {ratEventOffer && openedEventId === ratEventOffer.eventId && (
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

            {stormEventOffer && openedEventId === stormEventOffer.eventId && (
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

            {obstacleEventOffer && openedEventId === obstacleEventOffer.eventId && (
                <EventNotificationDialog
                    title="Event: Gefährliche Passage"
                    successText="Wenn du die Passage meisterst, fährt dein Schiff ohne Fracht- oder Zustandsschaden weiter."
                    failText="Wenn du ablehnst, gilt dieselbe 50/50 Chance wie beim Sturm. Bei Misserfolg halbiert das Backend Schiffszustand und Frachtwert."
                    imageSrc={obstacleDialogImage}
                    imageAlt="Kompass"
                    onAccept={handleObstacleEventAccept}
                    onDecline={handleObstacleEventDecline}
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

            {activeObstacleMinigame && (
                <ObstacleMinigameOverlay
                    config={{
                        eventId: activeObstacleMinigame.eventId,
                        travelId: activeObstacleMinigame.travelId,
                        timeLimitSeconds: activeObstacleMinigame.timeLimitSeconds,
                        startHealth: activeObstacleMinigame.startHealth,
                        routeViewType: ObstacleRouteViewResolver.resolve(activeObstacleMinigame),
                        shipIconUrl: activeObstacleMinigame.shipIconUrl,
                    }}
                    onFinished={handleObstacleMinigameFinished}
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

        </div>
    );
}