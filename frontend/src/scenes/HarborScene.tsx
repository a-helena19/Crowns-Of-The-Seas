import { useEffect, useState } from "react";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import backIcon from "../assets/goback.png";
import background from "../assets/background.jpg";
import "../style/harbor.css";
import type { AssignedCargoEntry } from "../types/assignedCargo";

interface Port {
    id: string;
    name: string;
}

interface HarborSceneProps {
    onClose: () => void;
    onCargoAssigned: (entry: AssignedCargoEntry) => void;
}

export default function HarborScene({ onClose, onCargoAssigned }: HarborSceneProps) {
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
    const [myPorts, setMyPorts] = useState<Port[]>([]);
    const [selectedShip, setSelectedShip] = useState<{
        id: string; name: string; fuel: number; condition: number;
        status: string; maxCargoCapacity?: number; iconUrl?: string;
        currentPortId?: string;
    } | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((ships: any[]) => {
                const portsMap = new Map<string, string>();
                ships
                    .filter(s => ["AT_PORT", "REFUELING", "REPAIRING", "LOADING", "UNLOADING", "READY_TO_DEPART"].includes(s.status) && s.currentPortId)
                    .forEach(s => {
                        const portName = window.__latestPorts?.find((p: any) => p.id === s.currentPortId)?.name ?? s.currentPortId;
                        portsMap.set(s.currentPortId, portName);
                    });

                // Heimathafen immer in der Liste anzeigen
                const homePortId = window.__homePortId;
                if (homePortId && !portsMap.has(homePortId)) {
                    const homePort = window.__latestPorts?.find((p: any) => p.id === homePortId);
                    if (homePort) {
                        portsMap.set(homePort.id, homePort.name);
                    }
                }

                // Wenn immer noch keine Ports → Heimathafen als einzigen verwenden
                if (portsMap.size === 0) {
                    const homePort = homePortId
                        ? window.__latestPorts?.find((p: any) => p.id === homePortId)
                        : null;
                    if (homePort) {
                        portsMap.set(homePort.id, homePort.name);
                    }
                }

                const portList = Array.from(portsMap.entries()).map(([id, name]) => ({ id, name }));
                setMyPorts(portList);
                if (portList.length >= 1) {
                    setSelectedPortId(prev => {
                        if (prev) return prev;
                        // Heimathafen bevorzugt vorauswählen
                        if (homePortId && portList.some(p => p.id === homePortId)) return homePortId;
                        return portList[0].id;
                    });
                }
            })
            .catch(console.error);
    }, [playerId, sessionId, token]);

    function handleShipSelect(ship: any) {
        setSelectedShip(ship);
        if (ship.currentPortId) setSelectedPortId(ship.currentPortId);
        setView("main");
    }

    function handleBack() {
        if (view !== "main") setView("main");
        else onClose();
    }

    function handleCargoAccepted(c: {
        id: string; from: string; to: string;
        weight: number; originPortId: string; destinationPortId: string;
        speedSetting: number; loadingDurationSeconds?: number;
    }) {
        if (!selectedShip) return;
        const entry: AssignedCargoEntry = {
            cargoId: c.id,
            shipId: selectedShip.id,
            shipName: selectedShip.name,
            shipIconUrl: selectedShip.iconUrl,
            from: c.from,
            to: c.to,
            weight: c.weight,
            maxCargoCapacity: selectedShip.maxCargoCapacity ?? c.weight,
            originPortId: c.originPortId,
            destinationPortId: c.destinationPortId,
            speedSetting: c.speedSetting,
            loadingDurationSeconds: c.loadingDurationSeconds ?? 10,
            loadingStartedAt: Date.now(),
            loadingDone: false,
            phase: "loading",
        };
        onCargoAssigned(entry);
        onClose();
    }

    return (
        <div className="scene">
            <img src={background} className="background" alt="" />
            <div className="back-icon-btn" onClick={handleBack}>
                <img src={backIcon} alt="Zurueck" />
            </div>

            {view === "main" && (
                <>
                    <Sailor />

                    {myPorts.length > 1 && (
                        <div className="harbor-port-selector">
                            <span className="harbor-port-selector-label">Hafen waehlen:</span>
                            {myPorts.map(p => (
                                <button
                                    key={p.id}
                                    className={`harbor-port-btn ${selectedPortId === p.id ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedPortId(p.id);
                                        setSelectedShip(null);
                                    }}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <DialogBubble
                        onOpenCargo={() => setView("cargo")}
                        onOpenShip={() => setView("ship")}
                        selectedShipName={selectedShip?.name}
                    />
                </>
            )}

            {view === "ship" && (
                <ShipScreen
                    onSelect={handleShipSelect}
                    filterByPortId={selectedPortId ?? undefined}
                />
            )}

            {view === "cargo" && (
                <CargoScreen
                    currentPortId={selectedPortId}
                    playerShipId={selectedShip?.id ?? null}
                    onCargoAccepted={handleCargoAccepted}
                />
            )}
        </div>
    );
}
