import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({ onOpenCargo, onOpenShip, onStartTravel, startTravelDisabled }: {
    onOpenCargo: () => void;
    onOpenShip: () => void;
    onStartTravel?: () => void;
    startTravelDisabled?: boolean;
}) {
    return (
        <PixelPanel className="bubble">
            <p>Wohin geht's hin, Captain?</p>
            <div className="options">
                <GameButton onClick={onOpenShip}>
                    Schiff auswählen
                </GameButton>
                <GameButton onClick={onOpenCargo}>
                    Frachtbörse öffnen
                </GameButton>
                {onStartTravel && (
                    <GameButton onClick={onStartTravel} variant="danger" disabled={startTravelDisabled}>
                        {startTravelDisabled ? "Reise wird gestartet…" : "Reise starten"}
                    </GameButton>
                )}
            </div>
        </PixelPanel>
    );
}