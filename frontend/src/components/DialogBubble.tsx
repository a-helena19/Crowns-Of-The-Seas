import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({ onOpenCargo, onOpenShip }: {
    onOpenCargo: () => void;
    onOpenShip: () => void;
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
            </div>
        </PixelPanel>
    );
}