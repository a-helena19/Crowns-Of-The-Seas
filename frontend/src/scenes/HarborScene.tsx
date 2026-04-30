import { useState, useEffect } from "react";
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

    // Häfen laden, in denen der Spieler Schiffe hat (Status AT_PORT)
    useEffect(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((ships: any[]) => {
                const portsMap = new Map<string, string>();
                ships
                    .filter(s => s.status === "AT_PORT" && s.currentPortId)
                    .forEach(s => {
                        const portName = window.__latestPorts?.find((p: any) => p.id === s.currentPortId)?.name ?? s.currentPortId;
                        portsMap.set(s.currentPortId, portName);
                    });
                const portList = Array.from(portsMap.entries()).map(([id, name]) => ({ id, name }));
                setMyPorts(portList);
                if (portList.length === 1) {
                    setSelectedPortId(portList[0].id);
                }
            })
            .catch(console.error);
    }, [playerId, sessionId, token]);

    function handleShipSelect(ship: any) {
        setSelectedShip(ship);
        // Port automatisch auf den Hafen des Schiffs setzen
        if (ship.currentPortId) setSelectedPortId(ship.currentPortId);
        setView("main");
    }

    function handleBack() {
        if (view !== "main") setView("main");
        else onClose();
    }

    function handleCargoAccepted(c: {
        id: string; from: string; to: string;
        weight: number; destinationPortId: string;
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
            destinationPortId: c.destinationPortId,
            speedSetting: c.speedSetting,
            loadingDurationSeconds: c.loadingDurationSeconds ?? 10,
            loadingStartedAt: Date.now(),
            loadingDone: false,
            phase: "loading",
        };
        onCargoAssigned(entry);
        onClose(); // zurück zur Karte – Ladevorgang läuft im Hintergrund
    }

    return (
        <div className="scene">
            <img src={background} className="background" alt="" />
            <div className="back-icon-btn" onClick={handleBack}>
                <img src={backIcon} alt="Zurück" />
            </div>

            {view === "main" && (
                <>
                    <Sailor />

                    {/* Port-Auswahl oben, wenn mehrere Häfen verfügbar */}
                    {myPorts.length > 1 && (
                        <div className="harbor-port-selector">
                            <span className="harbor-port-selector-label">Hafen wählen:</span>
                            {myPorts.map(p => (
                                <button
                                    key={p.id}
                                    className={`harbor-port-btn ${selectedPortId === p.id ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedPortId(p.id);
                                        setSelectedShip(null); // Schiff-Auswahl zurücksetzen bei Port-Wechsel
                                    }}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <DialogBubble
                        onOpenCargo={selectedShip ? () => setView("cargo") : undefined}
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

            {view === "cargo" && selectedShip && (
                <CargoScreen
                    currentPortId={selectedPortId}
                    playerShipId={selectedShip.id}
                    onCargoAccepted={handleCargoAccepted}
                />
            )}
        </div>
    );
}