import { useState } from "react";
import PixelPanel from "../components/PixelPanel";
import GameButton from "../components/GameButton";
import ShipClassScreen from "./ShipClassScreen";
import UsedShipMarketScreen from "./UsedShipMarketScreen";
import background from "../assets/shipmarket.png";
import "../style/harbor.css";
import "../style/shipbroker.css";
import BackButton from "../components/BackButton.tsx";

type ShipClass = "BUDGET" | "STANDARD" | "PREMIUM";

interface Props {
    onClose: () => void;
}

export default function ShipBrokerScene({ onClose }: Props) {
    const [selectedClass, setSelectedClass] = useState<ShipClass | null>(null);
    const [showUsedShips, setShowUsedShips] = useState(false);

    if (selectedClass) {
        return (
            <ShipClassScreen
                shipClass={selectedClass}
                onBack={() => setSelectedClass(null)}
            />
        );
    }

    if (showUsedShips) {
        return (
            <UsedShipMarketScreen
                onBack={() => setShowUsedShips(false)}
            />
        );
    }

    return (
        <div className="broker-scene">
            <img src={background} className="background" />

            <div className="broker-center">
                <BackButton onClick={onClose} />

                <PixelPanel className="broker-panel">
                    <p className="broker-panel-title">Was darf es sein?</p>

                    <div className="broker-options">
                        <GameButton onClick={() => setSelectedClass("BUDGET")}>
                            Budget Schiffe
                        </GameButton>

                        <GameButton onClick={() => setSelectedClass("STANDARD")}>
                            Standard Schiffe
                        </GameButton>

                        <GameButton onClick={() => setSelectedClass("PREMIUM")}>
                            Premium Schiffe
                        </GameButton>

                        <GameButton onClick={() => setShowUsedShips(true)}>
                            Gebrauchte Schiffe
                        </GameButton>
                    </div>
                </PixelPanel>
            </div>
        </div>
    );
}
