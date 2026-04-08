import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";

import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState } from "react";

export default function HarborScene() {
    const [selectedCargo, setSelectedCargo] = useState<any>(null);
    const [selectedShip, setSelectedShip] = useState<any>(null);
    const [view, setView] = useState<"main" | "cargo" | "ship">("main");

    return (
        <div className="scene">
            <div className="top-bar">
                <span>Crown of the Seas</span>
            </div>
            <img src={background} className="background" />

            {view === "main" && (
                <>
                    <Sailor />
                    <DialogBubble
                        onOpenCargo={() => setView("cargo")}
                        onOpenShip={() => setView("ship")}
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