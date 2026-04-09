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

    const PLAYER_ID = "00000000-0000-0000-0000-000000000001";

    async function handleStartTravel() {
        console.log("START TRAVEL CLICKED");
        if (!selectedShip || !selectedCargo) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/travels/start/${PLAYER_ID}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        shipId: selectedShip.id,
                        cargoId: selectedCargo.id,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Travel failed");
            }

            const data = await response.json();
            console.log("Travel gestartet:", data);

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
                        canStart={!!selectedCargo && !!selectedShip}
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


