import { useEffect, useCallback, useState } from "react";
import TopBar from "../components/TopBar.tsx";
import Game from "../Game.tsx";
import BottomBar from "../components/BottomBar.tsx";
import SideBar from "../components/SideBar";
import HarborScene from "../scenes/HarborScene.tsx";
import ShipBrokerScene from "../scenes/ShipBrokerScene.tsx";
import PortProfileScreen from "../scenes/PortProfileScreen.tsx";
import { useGameSessionWebSocket } from "../hooks/useGameSessionWebSocket.ts";
import CargoManagementScreen from "../scenes/CargoManagementScreen";
import type { AssignedCargoEntry } from "../types/assignedCargo";
import RewardToast from "../components/RewardToast.tsx";
import SmuggleOfferDialog from "../components/SmuggleOfferDialog.tsx";

export const TOP_BAR_HEIGHT = '9vh';
export const BOTTOM_BAR_HEIGHT = '20vh';

export default function GameScreen() {
    const [view, setView] = useState<"map" | "harbor" | "broker" | "portProfile" | "cargoManagement">("map");
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
        offerId: string; portId: string; reward: number; cargoDescription: string;
    } | null>(null);

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
        if (typeof window.__tickRateMs !== 'number' || !Number.isFinite(window.__tickRateMs) || window.__tickRateMs <= 0) {
            window.__tickRateMs = tickRateSeconds * 1000;
        }
    }, [tickRateSeconds]);

    useEffect(() => {
        const onPortClicked = (e: Event) => {
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
                ships: { playerShipId: string; status: string; arrivalTick?: number; currentPortId?: string; travelId?: string }[]
            }>).detail;

            setAssignedCargos(prev => prev.map(entry => {
                if (entry.phase !== "en_route" && entry.phase !== "unloading") return entry;
                const ship = detail.ships.find(s => s.playerShipId === entry.shipId);
                if (!ship) return entry;
                if (ship.status === "UNLOADING") {
                    return  { ...entry, phase: "unloading", arrivalTick: ship.arrivalTick, currentTick: detail.currentTick, unloadingCompletedAtTick: ship.arrivalTick, };
                }
                if (ship.status === "EN_ROUTE") {
                    return { ...entry, currentTick: detail.currentTick, arrivalTick: ship.arrivalTick ?? entry.arrivalTick, };
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
                cargoRewards: { actualReward: number; percentage: number; baseReward: number }[];
            }>).detail;
            if (data.playerId !== playerId) return;

            window.dispatchEvent(new CustomEvent("player-balance-updated"));

            setAssignedCargos(prev => {
                const updated = prev.map(entry => {
                    if (entry.travelId !== data.travelId) return entry;
                    return {
                        ...entry,
                        phase: "completed" as const,
                        reward: data.totalReward,
                        rewardDetails: data.cargoRewards[0]
                            ? {
                                baseReward: data.cargoRewards[0].baseReward,
                                actualReward: data.cargoRewards[0].actualReward,
                                percentage: data.cargoRewards[0].percentage
                            }
                            : undefined,
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
                reward: number; cargoDescription: string;
            }>).detail;
            if (data.playerId !== playerId) return;
            setSmuggleOffer({
                offerId: data.offerId,
                portId: data.portId,
                reward: data.reward,
                cargoDescription: data.cargoDescription,
            });
        };
        window.addEventListener("smuggle-offer", handler);
        return () => window.removeEventListener("smuggle-offer", handler);
    }, [playerId]);

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
                setView("map");
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
                (view === "harbor" || view === "broker" || view === "cargoManagement") ? "open" : "closed"
            }`}>
                {view === "harbor" && (
                    <HarborScene
                        onClose={() => setView("map")}
                        onCargoAssigned={handleCargoAssigned}
                    />
                )}
                {view === "broker" && <ShipBrokerScene onClose={() => setView("map")} />}
                {view === "cargoManagement" && (
                    <CargoManagementScreen
                        assignedCargos={assignedCargos}
                        onCargoLoadingDone={handleCargoCompleted}
                        onCargoRemoved={handleCargoRemoved}
                        onCargoPhaseChange={handleCargoPhaseChange}
                        onClose={() => setView("map")}
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
        </div>
    );
}