import { useState } from "react";
import smuggleBg from "../assets/smuggle_bg.png";
import smuggler from "../assets/smuggler.png"
import "../style/smuggleDialog.css";
import audioEngine from "../audio/AudioEngine.ts";

interface SmuggleOfferProps {
    offerId: string;
    portId: string;
    reward: number;
    cargoDescription: string;
    onAccept: () => void;
    onDecline: () => void;
}

export default function SmuggleOfferDialog({reward, onAccept, onDecline} : SmuggleOfferProps) {    const [responding, setResponding] = useState(false);

    function handleAccept() {
        if (responding) {
            return;
        }
        setResponding(true);
        audioEngine.playSfx('evilLaugh');
        onAccept();
    }

    function handleDecline() {
        if (responding) {
            return;
        }

        setResponding(true);
        onDecline();
    }

    return (
        <div className="smuggle-overlay">
            <div className="smuggle-container">
            <div className="smuggler-info">
                <img src={smuggler} alt="Schmuggler" className="smuggler-portrait"/>
                <p className="smuggler-name">Verdächtiger Mann</p>
            </div>
            <div className="smuggle-dialog">
                <img src={smuggleBg} alt="Hintergrund" className="smuggle-dialog-bg" />
                    <div className="smuggle-content">
                        <div className="smuggle-text">
                            <p>
                                Willst du etwas Zusätzliches an Bord nehmen? Dein Anteil
                                springt natürlich auch dabei raus.
                            </p>
                        </div>
                        <div className="smuggle-buttons">
                            <button className="smuggle-btn smuggle-btn-decline" onClick={handleDecline} disabled={responding}>Ablehnen</button>
                            <button className="smuggle-btn smuggle-btn-accept" onClick={handleAccept} disabled={responding}>Annehmen +{reward.toLocaleString("de-DE")}T</button>
                        </div>
                        <div className="smuggle-risk-hint">
                            ! Risiko bei Kontrollen
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
