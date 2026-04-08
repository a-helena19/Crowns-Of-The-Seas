import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({ onOpenCargo, onOpenShip, canStart}: {
    onOpenCargo: () => void;
    onOpenShip: () => void;
    canStart: boolean;
}) {
    return (
        <PixelPanel className="bubble">
            <p>Wohin geht’s hin, Captain?</p>
            <div className="options">
                <GameButton onClick={onOpenCargo}>
                    Frachtbörse öffnen
                </GameButton>
                <GameButton onClick={onOpenShip}>
                    Schiff auswählen
                </GameButton>
                <GameButton
                    variant="danger"
                    disabled={!canStart}
                >
                    Reise starten
                </GameButton>
            </div>
        </PixelPanel>
    );
}