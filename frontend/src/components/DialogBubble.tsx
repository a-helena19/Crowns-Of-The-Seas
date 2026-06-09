import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({
                                         onOpenCargo,
                                         onOpenEmptyVoyage,
                                         onOpenShip,
                                         selectedShipName,
                                     }: {
    onOpenCargo?: () => void;
    onOpenEmptyVoyage?: () => void;
    onOpenShip: () => void;
    selectedShipName?: string;
}) {
    return (
        <PixelPanel className="bubble">
            <p>Wohin geht's hin, Kapitän?</p>
            {selectedShipName && (
                <div className="harbor-selected-ship-hint">
                    {selectedShipName} ausgewählt
                </div>
            )}
            <div className="options">
                <GameButton onClick={onOpenShip}>
                    {selectedShipName ? "Schiff wechseln" : "Schiff auswählen"}
                </GameButton>
                <GameButton onClick={onOpenCargo ?? (() => {})}>
                    Frachtbörse öffnen
                </GameButton>
                <GameButton onClick={onOpenEmptyVoyage ?? (() => {})}>
                    Leerfahrt
                </GameButton>
            </div>
        </PixelPanel>
    );
}