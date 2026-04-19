import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import type { CargoSelection } from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import backIcon from "../assets/goback.png";
import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState, useEffect } from "react";

interface SelectedCargo {
    id: string;
    name: string;
    originPortName: string;
    destinationPortId: string;
    destinationPortName: string;
    reward: number;
    capacity: number;
    cargoType: string;
    risk: number;
}

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

interface ApiErrorResponse {
    error?: string;
    message?: string;
}

export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedCargo, setSelectedCargo] = useState<SelectedCargo | null>(null);
    const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
    const [speedSetting, setSpeedSetting] = useState<number>(0.75);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPortId, setCurrentPortId] = useState<string | null>(null);

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

    async function handleStartTravel() {
        if (!playerId || !sessionId) { setError("Session oder Spieler nicht gefunden."); return; }
        if (!selectedShip) { setError("Kein Schiff ausgewählt."); return; }
        if (!selectedCargo) { setError("Keine Fracht ausgewählt."); return; }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    playerShipId: selectedShip.id,
                    destinationPortId: selectedCargo.destinationPortId,
                    sessionCargoId: selectedCargo.id,
                    speedSetting,
                }),
            });

            let data: ApiErrorResponse | null = null;
            const text = await response.text();
            try { data = text ? (JSON.parse(text) as ApiErrorResponse) : null; } catch { data = null; }

            if (!response.ok) {
                const err = data?.error ?? "";
                if (err === "CARGO_TAKEN") {
                    setSelectedCargo(null);
                    setError("Diese Fracht wurde soeben von einem anderen Kapitän übernommen. Wähle eine neue Fracht.");
                } else if (err === "CAPACITY_EXCEEDED") {
                    setError("Dein Schiff ist zu klein für diese Fracht.");
                } else if (err === "INSUFFICIENT_FUEL") {
                    setError(data?.message ?? "Nicht genug Treibstoff.");
                } else {
                    setError(data?.message ?? "Reise konnte nicht gestartet werden.");
                }
                return;
            }

            onClose();
        } catch {
            setError("Verbindungsfehler.");
        } finally {
            setLoading(false);
        }
    }

    function handleBack() {
        if (view === "cargo" || view === "ship") setView("main");
        else onClose();
    }

    function handleCargoSelect(selection: CargoSelection) {
        setSelectedCargo({
            id: selection.cargo.id,
            name: selection.cargo.name,
            originPortName: selection.cargo.originPortName,
            destinationPortId: selection.cargo.destinationPortId,
            destinationPortName: selection.cargo.destinationPortName,
            reward: selection.cargo.reward,
            capacity: selection.cargo.capacity,
            cargoType: selection.cargo.cargoType,
            risk: selection.cargo.risk,
        });
        setSpeedSetting(selection.speedSetting);
        setError(null);
        setView("main");
    }

    // Reise starten nur wenn Cargo UND Schiff explizit gewählt wurden
    const canStart = !!selectedShip && !!selectedCargo && !loading;

    // Fallback-Schiff für das Info-Panel wenn noch nichts explizit ausgewählt wurde
    // (Cargo ist oft früher gewählt als Ship)

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
                        onOpenCargo={() => setView("cargo")}
                        onOpenShip={() => setView("ship")}
                        onStartTravel={handleStartTravel}
                        canStart={canStart}
                    />

                    {(selectedCargo || selectedShip) && (
                        <InfoPanel
                            cargo={selectedCargo}
                            ship={selectedShip}
                            speedSetting={selectedCargo ? speedSetting : undefined}
                        />
                    )}

                    {error && <div className="harbor-error-toast">{error}</div>}
                    {loading && <div className="harbor-loading-overlay">Reise wird gestartet…</div>}
                </>
            )}

            {view === "cargo" && (
                <CargoScreen
                    currentPortId={currentPortId}
                    playerShipId={selectedShip?.id ?? null}
                    onSelect={handleCargoSelect}
                />
            )}

            {view === "ship" && (
                <ShipScreen
                    onSelect={(ship) => {
                        setSelectedShip(ship as SelectedShip);
                        setError(null);
                        setView("main");
                    }}
                />
            )}
        </div>
    );
}