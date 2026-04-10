import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import backIcon from "../assets/goback.png";

import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState } from "react";


export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedCargo, setSelectedCargo] = useState<any>(null);
    const [selectedShip, setSelectedShip] = useState<any>(null);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");

    const userData = localStorage.getItem('crowns_user');
    const PLAYER_ID = userData ? JSON.parse(userData).id : null;
    const DESTINATION_PORT_ID = "00000000-0000-0000-0000-000000000002";

    async function handleStartTravel() {
        console.log("START TRAVEL CLICKED");

        console.log("SHIP:", selectedShip);
        console.log("CARGO:", selectedCargo);
        console.log("START TRAVEL CLICKED");
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;
        if (!PLAYER_ID || !sessionId) {
            console.error("Missing playerId or sessionId");
            return;
        }

        if (!selectedShip || !selectedCargo) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/travels/start/${PLAYER_ID}?sessionId=${sessionId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}`,

                    },
                    body: JSON.stringify({
                        playerShipId: selectedShip.id,        // ✅ richtiges Feld
                        destinationPortId: DESTINATION_PORT_ID,
                        speedSetting: 1.0,
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Travel failed:', err);
                return;
            }

            // HarborScene.tsx — nach onClose()
            const data = await response.json();
            console.log('Travel gestartet:', data);

// Hardcodierte Port-Koordinaten (in % der Kartengröße)
            const PORTS: Record<string, { x: number; y: number; name: string }> = {
                ORIGIN:      { x: 50, y: 50, name: 'Heimathafen' },
                DESTINATION: { x: 75, y: 35, name: 'Zielhafen'  },
            };

// Ports auf der Map anzeigen
            window.dispatchEvent(new CustomEvent('backend-ports', {
                detail: [PORTS.ORIGIN, PORTS.DESTINATION],
            }));

// Schiff von Origin nach Destination schicken
// data.distance = 100, tickRateMs aus sessionStorage oder Fallback
            const sessionData = sessionStorage.getItem('currentSession');
            const tickRateMs = sessionData ? JSON.parse(sessionData).tickRateSeconds * 1000 : 3000;
            const totalDurationMs = (data.distance / data.speedSetting) * tickRateMs;

            window.dispatchEvent(new CustomEvent('backend-ship-position', {
                detail: { x: PORTS.ORIGIN.x, y: PORTS.ORIGIN.y, status: 'AT_PORT', tickRateMs: 0 },
            }));

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('backend-ship-position', {
                    detail: {
                        x: PORTS.DESTINATION.x,
                        y: PORTS.DESTINATION.y,
                        status: 'EN_ROUTE',
                        tickRateMs: totalDurationMs,
                    },
                }));
            }, 100);

            onClose();

        } catch (err) {
            console.error(err);
        }
    }

    function handleBack() {
        if (view === "cargo" || view === "ship") {
            setView("main");
        } else {
            onClose();
        }
    }



    return (
        <div className="scene">
            <img src={background} className="background" />

            <div className="back-icon-btn" onClick={handleBack}>
                <img src={backIcon} alt="Zurück" />
            </div>



            {view !== "main" && (
                <div className="back-icon-btn" onClick={handleBack}>
                    <img src={backIcon} alt="Zurück" />
                </div>
            )}

            {view === "main" && (
                <>
                    <Sailor />
                    <DialogBubble
                        onOpenCargo={() => setView("cargo")}
                        onOpenShip={() => setView("ship")}
                        onStartTravel={handleStartTravel}
                        canStart={!!selectedShip}
                    />
                    {(selectedCargo || selectedShip) && (
                        <InfoPanel cargo={selectedCargo} ship={selectedShip} />
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
                    onSelect={(ship) => {
                        setSelectedShip(ship);
                        setView("main");
                    }}
                />
            )}
        </div>
    );
}


