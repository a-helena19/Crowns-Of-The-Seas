import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import backIcon from "../assets/goback.png";
import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState, useEffect } from "react";

interface SelectedShip {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    status: string;
    maxCargoCapacity?: number;
    currentPortId?: string;
}

interface ShipResponse {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    status: string;
    maxCargoCapacity?: number;
    currentPortId?: string;
}

export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [currentPortId, setCurrentPortId] = useState<string | null>(null);
    const [infoHint, setInfoHint] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId: string | null = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId: string | null = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json() as Promise<ShipResponse[]>)
            .then((ships) => {
                const atPort = ships.find((s) => s.status === "AT_PORT" && s.currentPortId);
                if (atPort?.currentPortId) {
                    setCurrentPortId(atPort.currentPortId);
                }
            })
            .catch(console.error);
    }, [playerId, sessionId, token]);

    function handleBack() {
        if (view === "cargo" || view === "ship") setView("main");
        else onClose();
    }

    function handleOpenCargo() {
        setInfoHint(null);
        setView("cargo");
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
                    <DialogBubble
                        onOpenCargo={handleOpenCargo}
                        onOpenShip={() => setView("ship")}
                    />

                    {selectedShip && <InfoPanel ship={selectedShip} />}

                    {infoHint && <div className="harbor-error-toast">{infoHint}</div>}
                </>
            )}

            {view === "cargo" && (
                <CargoScreen
                    currentPortId={currentPortId}
                    playerShipId={selectedShip?.id ?? null}
                    onTravelStarted={onClose}
                />
            )}

            {view === "ship" && (
                <ShipScreen
                    onSelect={(ship) => {
                        setSelectedShip(ship as SelectedShip);
                        setInfoHint(null);
                        setView("main");
                    }}
                />
            )}
        </div>
    );
}