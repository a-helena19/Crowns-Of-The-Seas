import { useState } from "react";
import PixelPanel from "../components/PixelPanel";
import GameButton from "../components/GameButton";
import ShipClassScreen from "./ShipClassScreen";
import background from "../assets/shipmarket.png";
import "../style/harbor.css";
import "../style/shipbroker.css";
import backIcon from "../assets/goback.png";

type ShipClass = "BUDGET" | "STANDARD" | "PREMIUM";

interface Props {
    onClose: () => void;
}

export default function ShipBrokerScene({ onClose }: Props) {
    const [selectedClass, setSelectedClass] = useState<ShipClass | null>(null);

    if (selectedClass) {
        return (
            <ShipClassScreen
                shipClass={selectedClass}
                onBack={() => setSelectedClass(null)}
            />
        );
    }

    return (
        <div className="broker-scene">
            <img src={background} className="background" />

            <div className="broker-center">
                <div className="back-icon-btn" onClick={onClose}>
                    <img src={backIcon} alt="Zurück" />
                </div>

                <PixelPanel className="broker-panel">
                    <p className="broker-panel-title">Was darf es sein?</p>

                    <div className="broker-options">
                        <GameButton onClick={() => setSelectedClass("BUDGET")}>
                            Budget Ships
                        </GameButton>

                        <GameButton onClick={() => setSelectedClass("STANDARD")}>
                            Standard Ships
                        </GameButton>

                        <GameButton onClick={() => setSelectedClass("PREMIUM")}>
                            Premium Ships
                        </GameButton>
                    </div>
                </PixelPanel>
            </div>
        </div>
    );
}