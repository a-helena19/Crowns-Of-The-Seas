import GameButton from "./GameButton";
import PixelPanel from "./PixelPanel";

export default function DialogBubble({
    onOpenCargo, onOpenShip, onStartTravel, startTravelDisabled,
    pilotageSelected, onTogglePilotage,
}: {
    onOpenCargo: () => void;
    onOpenShip: () => void;
    onStartTravel?: () => void;
    startTravelDisabled?: boolean;
    pilotageSelected?: boolean;
    onTogglePilotage?: () => void;
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
                {onTogglePilotage && (
                    <div className="pilotage-row">
                        <button
                            className={`pilotage-toggle ${pilotageSelected ? "active" : ""}`}
                            onClick={onTogglePilotage}
                        >
                            <span className="pilotage-check">{pilotageSelected ? "✓" : "○"}</span>
                            <span className="pilotage-label">Lotsendienst</span>
                            <span className="pilotage-cost">600 Taler</span>
                        </button>
                    </div>
                )}
                {onStartTravel && (
                    <GameButton onClick={onStartTravel} variant="danger" disabled={startTravelDisabled}>
                        {startTravelDisabled ? "Reise wird gestartet…" : "Reise starten"}
                    </GameButton>
                )}
            </div>
        </PixelPanel>
    );
}
