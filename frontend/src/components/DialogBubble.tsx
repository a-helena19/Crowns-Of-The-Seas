import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({
                                         onOpenCargo,
                                         onOpenShip,
                                         selectedShipName,
                                     }: {
    onOpenCargo?: () => void;
    onOpenShip: () => void;
    selectedShipName?: string;
}) {
    return (
        <PixelPanel className="bubble">
            <p>Wohin geht's hin, Captain?</p>
            {selectedShipName && (
                <div className="harbor-selected-ship-hint">
                    {selectedShipName} ausgewaehlt
                </div>
            )}
            <div className="options">
                <GameButton onClick={onOpenShip}>
                    {selectedShipName ? "Schiff wechseln" : "Schiff auswaehlen"}
                </GameButton>
                <GameButton onClick={onOpenCargo ?? (() => {})}>
                    Frachtboerse oeffnen
                </GameButton>
            </div>
        </PixelPanel>
    );
}
