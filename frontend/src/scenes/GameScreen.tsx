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
import LeaderboardOverlay from "../components/LeaderboardOverlay";


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

    const [assignedCargos, setAssignedCargos] = useState<AssignedCargoEntry[]>([]);
    const [rewardToasts, setRewardToasts] = useState<{
        id: string; shipName: string; from: string; to: string; reward: number;
    }[]>([]);
    const [smuggleOffer, setSmuggleOffer] = useState<{
        offerId: string; portId: string; travelId: string; playerShipId: string; reward: number; cargoDescription: string;
    } | null>(null);

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

    // Travel complete → reward
    useEffect(() => {
        const handler = (e: Event) => {
            const data = (e as CustomEvent<{
                travelId: string;
                playerId: string;
                totalReward: number;
                baseReward: number;
                cargoRewards: { cargoId: string; cargoName: string; destinationPort: string; baseReward: number; bonusReward: number; actualReward: number; percentage: number; status: string; cargoType: string }[];
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

            {sessionId && (
                <LeaderboardOverlay
                    sessionId={sessionId}
                    currentUserId={playerId}
                />
            )}
        </div>
    );
}
