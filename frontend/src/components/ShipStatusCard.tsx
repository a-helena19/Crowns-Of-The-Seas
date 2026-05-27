interface ShipStatusCardProps {
    name: string;
    shipClass?: string;
    iconUrl: string;
    status: string;
    fuel: number;
    condition: number;
    currentPortName?: string | null;
    pendingEventLabel?: string;
    onClick?: () => void;
}

function formatStatus(status: string): string {
    switch (status) {
        case "AT_PORT":
            return "Im Hafen";
        case "EN_ROUTE":
            return "Unterwegs";
        case "READY_TO_DEPART":
            return "Reisebereit";
        case "LOADING":
            return "Wird beladen";
        case "UNLOADING":
            return "Wird entladen";
        case "REFUELING":
            return "Wird betankt";
        case "REPAIRING":
            return "Wird repariert";
        default:
            return status;
    }
}

export default function ShipStatusCard({
    name,
    shipClass,
    iconUrl,
    status,
    fuel,
    condition,
    currentPortName,
    pendingEventLabel,
    onClick,
}: ShipStatusCardProps) {
    const isActionable = Boolean(pendingEventLabel) || status === "READY_TO_DEPART" || status === "LOADING" || status === "UNLOADING";
    const displayedStatus = pendingEventLabel ? `Event: ${pendingEventLabel}` : formatStatus(status);

    return (
        <article
            className={`ship-status-card ${isActionable ? "actionable" : ""} ${pendingEventLabel ? "event-pending" : ""} ${onClick ? "clickable" : ""}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
        >
            <div className="ship-status-header">
                <strong className="ship-status-name">{name}</strong>
                {shipClass && <span className="ship-status-class">{shipClass}</span>}
            </div>

            <div className="ship-status-body">
                <img src={iconUrl} alt={name} className="ship-status-icon" />
                <div className="ship-status-meta">
                    <div className="ship-status-line">
                        <span>Status</span>
                        <strong>{displayedStatus}</strong>
                    </div>
                    {currentPortName && (
                        <div className="ship-status-line">
                            <span>Ort</span>
                            <strong>{currentPortName}</strong>
                        </div>
                    )}
                </div>
            </div>

            <div className="ship-status-bars">
                <div className="ship-status-bar-wrap">
                    <div className="ship-status-bar-top">
                        <span>Tank</span>
                        <strong>{Math.round(fuel)}%</strong>
                    </div>
                    <div className="ship-status-bar">
                        <div className="ship-status-fill fuel" style={{ width: `${Math.max(0, Math.min(100, fuel))}%` }} />
                    </div>
                </div>
                <div className="ship-status-bar-wrap">
                    <div className="ship-status-bar-top">
                        <span>Zustand</span>
                        <strong>{Math.round(condition)}%</strong>
                    </div>
                    <div className="ship-status-bar">
                        <div className="ship-status-fill condition" style={{ width: `${Math.max(0, Math.min(100, condition))}%` }} />
                    </div>
                </div>
            </div>
        </article>
    );
}
