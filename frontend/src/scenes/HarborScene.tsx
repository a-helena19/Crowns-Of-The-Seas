import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import LoadingScreen from "./LoadingScreen";
import backIcon from "../assets/goback.png";

import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState } from "react";

export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedCargo, setSelectedCargo] = useState<any>(null);
    const [selectedShip, setSelectedShip] = useState<any>(null);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLoadingShip, setIsLoadingShip] = useState(false);
    const [loadingDone, setLoadingDone] = useState(false);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;

    async function handleStartTravel() {
        console.log("CLICKED START TRAVEL");
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;

        if (!playerId || !sessionId) {
            setError("Session oder Spieler nicht gefunden.");
            return;
        }
        if (!selectedShip) {
            setError("Kein Schiff ausgewählt.");
            return;
        }
        if (!selectedCargo) {
            setError("Kein Cargo ausgewählt.");
            return;
        }

        setLoading(true);
        setError(null);

        console.log("playerId:", playerId);
        console.log("sessionId:", sessionId);
        console.log("selectedShip:", selectedShip);
        console.log("selectedCargo:", selectedCargo);
        console.log("SHIP ID:", selectedShip?.id);
        console.log("DEST PORT:", selectedCargo?.destinationPortId);
        console.log("TOKEN:", localStorage.getItem("auth_token"));

        try {
            const response = await fetch(
                `/api/travels/start/${playerId}?sessionId=${sessionId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
                    },
                    body: JSON.stringify({
                        playerShipId: selectedShip.id,
                        destinationPortId: selectedCargo.destinationPortId,
                        speedSetting: 1.0,
                    }),
                }
            );

            const text = await response.text();
            console.log("RAW RESPONSE:", text);

            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            console.log("STATUS:", response.status);
            console.log("RESPONSE:", data);

            if (!response.ok) {
                setError(data?.message ?? "Travel konnte nicht gestartet werden.");
                return;
            }

            console.log("SUCCESS:", data);
            onClose();
        } catch (err) {
            setError("Verbindungsfehler.");
        } finally {
            setLoading(false);
        }
    }

    function handleShipSelect(ship: any) {
        setSelectedShip(ship);
        setError(null);
        setLoadingDone(false);
        setView("main");
        const cargoWeight = selectedCargo?.weight ?? 0;
        const shipCap = ship.maxCargoCapacity ?? Infinity;
        if (selectedCargo && cargoWeight <= shipCap) {
            setIsLoadingShip(true);
        }
    }

    function handleBack() {
        if (view === "cargo" || view === "ship") {
            setView("main");
        } else {
            onClose();
        }
    }

    const overCapacity = !!(selectedShip && selectedCargo &&
        selectedCargo.weight > (selectedShip.maxCargoCapacity ?? Infinity));

    const canStart = !!selectedShip && !!selectedCargo && !loading && !isLoadingShip && !overCapacity;

    return (
        <div className="scene">
            <img src={background} className="background" />

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
                    <div className="right-side-panels">
                        {(selectedCargo || selectedShip) && (
                            <InfoPanel cargo={selectedCargo} ship={selectedShip} />
                        )}
                        {(isLoadingShip || loadingDone) && selectedShip && selectedCargo && (
                            <LoadingScreen
                                ship={selectedShip}
                                cargo={{ from: selectedCargo.from, to: selectedCargo.to, weight: selectedCargo.weight }}
                                done={loadingDone}
                                onComplete={() => { setIsLoadingShip(false); setLoadingDone(true); }}
                            />
                        )}
                    </div>
                    {overCapacity && selectedShip && selectedCargo && (
                        <div style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(180,30,30,0.93)",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            border: "2px solid #f44336",
                            whiteSpace: "nowrap",
                        }}>
                            Fracht ({selectedCargo.weight}t) übersteigt die Kapazität des Schiffs ({selectedShip.maxCargoCapacity}t)!
                        </div>
                    )}
                    {error && (
                        <div style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(200,50,50,0.9)",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}>
                            {error}
                        </div>
                    )}
                </>
            )}

            {view === "cargo" && (
                <CargoScreen
                    onSelect={(cargo) => {
                        setSelectedCargo(cargo);
                        setView("main");
                    }}
                />
            )}

            {view === "ship" && (
                <ShipScreen
                    onSelect={handleShipSelect}
                />
            )}
        </div>
    );
}