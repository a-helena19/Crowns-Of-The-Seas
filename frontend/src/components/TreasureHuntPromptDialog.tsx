import { useEffect, useState } from "react";
import "../style/eventNotification.css";
import treasureHuntDialogImage from "../assets/minigame/treasurehunt/DialogP.png";

interface TreasureHuntPromptDialogProps {
    onAccept: () => void;
    onDecline: () => void;
}

export default function TreasureHuntPromptDialog({ onAccept, onDecline }: TreasureHuntPromptDialogProps) {
    const [responding, setResponding] = useState(false);
    const [cleanedDialogImage, setCleanedDialogImage] = useState<string>(treasureHuntDialogImage);

    useEffect(() => {
        const img = new Image();
        img.src = treasureHuntDialogImage;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r > 238 && g > 238 && b > 238) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            setCleanedDialogImage(canvas.toDataURL("image/png"));
        };
    }, []);

    function handleAccept() {
        if (responding) return;
        setResponding(true);
        onAccept();
    }

    function handleDecline() {
        if (responding) return;
        setResponding(true);
        onDecline();
    }

    return (
        <div className="event-notification-overlay">
            <div className="event-notification-panel">
                <div className="event-notification-header treasure-hunt-prompt-header">
                    <img
                        src={cleanedDialogImage}
                        alt="Schatzjagd Vorschau"
                        className="event-notification-preview treasure-hunt-prompt-preview"
                    />
                    <h3 className="event-notification-title">Schatzjagd</h3>
                </div>

                <div className="event-notification-section">
                    <p>Es wurde ein Schatz gesichtet. Willst du der Spur folgen?</p>
                </div>

                <div className="event-notification-actions">
                    <button className="event-btn event-btn-decline" onClick={handleDecline} disabled={responding}>
                        <span>Nein</span>
                        <small>Reise geht normal weiter, kein Bonus und kein Risiko.</small>
                    </button>
                    <button className="event-btn event-btn-accept" onClick={handleAccept} disabled={responding}>
                        <span>Ja</span>
                        <small>Schatzjagd startet: Bonus möglich, bei Fang droht Frachtverlust.</small>
                    </button>
                </div>
            </div>
        </div>
    );
}
