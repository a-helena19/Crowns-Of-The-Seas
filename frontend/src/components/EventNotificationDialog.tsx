import { useState } from "react";
import "../style/eventNotification.css";

interface EventNotificationDialogProps {
    title: string;
    successText: string;
    failText: string;
    imageSrc?: string;
    imageAlt?: string;
    onAccept: () => void;
    onDecline: () => void;
}

export default function EventNotificationDialog({
    title,
    successText,
    failText,
    imageSrc,
    imageAlt,
    onAccept,
    onDecline,
}: EventNotificationDialogProps) {
    const [responding, setResponding] = useState(false);

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
                <div className="event-notification-header">
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt={imageAlt ?? "Event-Vorschau"}
                            className="event-notification-preview"
                        />
                    )}
                    <h3 className="event-notification-title">{title}</h3>
                </div>

                <div className="event-notification-section">
                    <div className="event-notification-label success">Bei Erfolg</div>
                    <p>{successText}</p>
                </div>

                <div className="event-notification-section">
                    <div className="event-notification-label fail">Bei Misserfolg oder Ablehnen</div>
                    <p>{failText}</p>
                </div>

                <div className="event-notification-actions">
                    <button className="event-btn event-btn-decline" onClick={handleDecline} disabled={responding}>
                        Ablehnen
                    </button>
                    <button className="event-btn event-btn-accept" onClick={handleAccept} disabled={responding}>
                        Annehmen
                    </button>
                </div>
            </div>
        </div>
    );
}
