import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
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

export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedCargo, setSelectedCargo] = useState<SelectedCargo | null>(null);
    const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPortId, setCurrentPortId] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    // Ermittle aktuellen Port des Spielers anhand seiner Schiffe
    useEffect(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        })
            .then((r) => r.json())
            .then((ships: any[]) => {
                const atPort = ships.find((s) => s.status === "AT_PORT" && s.currentPortId);
                if (atPort?.currentPortId) {
                    setCurrentPortId(atPort.currentPortId);
                }
            })
            .catch(console.error);
    }, [playerId, sessionId]);

    async function handleStartTravel() {
        if (!playerId || !sessionId) { setError("Session oder Spieler nicht gefunden."); return; }
        if (!selectedShip) { setError("Kein Schiff ausgewählt."); return; }
        if (!selectedCargo) { setError("Keine Fracht ausgewählt."); return; }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
                },
                body: JSON.stringify({
                    playerShipId: selectedShip.id,
                    destinationPortId: selectedCargo.destinationPortId,
                    sessionCargoId: selectedCargo.id,
                    speedSetting: 1.0,
                }),
            });

            let data: any = null;
            const text = await response.text();
            try { data = text ? JSON.parse(text) : null; } catch { data = null; }

            if (!response.ok) {
                const err = data?.error ?? "";
                if (err === "CARGO_TAKEN") {
                    setError("⚡ Diese Fracht wurde gerade von einem anderen Kapitän übernommen!");
                } else if (err === "CAPACITY_EXCEEDED") {
                    setError("⛵ Dein Schiff ist zu klein für diese Fracht.");
                } else {
                    setError(data?.message ?? "Reise konnte nicht gestartet werden.");
                }
                return;
            }

            // Erfolg → zurück zur Map
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
                        canStart={!!selectedShip && !!selectedCargo && !loading}
                    />

                    {/* Cargo + Schiff rechts im InfoPanel anzeigen */}
                    {(selectedCargo || selectedShip) && (
                        <InfoPanel cargo={selectedCargo} ship={selectedShip} />
                    )}

                    {error && (
                        <div style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(200,50,50,0.92)",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            maxWidth: "420px",
                            textAlign: "center",
                            zIndex: 200,
                        }}>
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 300,
                            color: "#e8d9b0",
                            fontSize: 18,
                            fontFamily: "Georgia, serif",
                        }}>
                            Reise wird gestartet…
                        </div>
                    )}
                </>
            )}

            {view === "cargo" && (
                <CargoScreen
                    currentPortId={currentPortId}
                    onSelect={(cargo) => {
                        setSelectedCargo(cargo as SelectedCargo);
                        setError(null);
                        setView("main");
                    }}
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
