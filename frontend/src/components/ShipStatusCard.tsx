import type { CSSProperties } from "react";

type PendingEventKind =
    | "rats" | "storm" | "obstacle" | "treasure_hunt"
    | "arrival_docking" | "smuggle" | "customs";

interface ShipStatusCardProps {
    name: string;
    shipClass?: string;
    iconUrl: string;
    status: string;
    fuel: number;
    condition: number;
    currentPortName?: string | null;
    pendingEventLabel?: string;
    pendingEventKind?: PendingEventKind;
    urgent?: boolean;
    onClick?: () => void;
}

interface StatusVisual {
    label: string;
    color: string;
}

// Alle 12 ShipStatus-Werte – jeweils eine eigene Farbe
const STATUS_VISUALS: Record<string, StatusVisual> = {
    AT_MARKET:       { label: "Am Markt",         color: "#9b5cc4" },
    IN_REGISTRATION: { label: "In Registrierung", color: "#8a7d6a" },
    AT_PORT:         { label: "Im Hafen",         color: "#2f7fb3" },
    LOADING:         { label: "Wird beladen",     color: "#d68a2f" },
    UNLOADING:       { label: "Wird entladen",    color: "#bf6e1f" },
    BLOCKED:         { label: "Blockiert",        color: "#b33a3a" },
    CUSTOMS_CHECK:   { label: "Zollkontrolle",    color: "#d0592a" },
    EN_ROUTE:        { label: "Unterwegs",        color: "#2f93d6" },
    DAMAGED:         { label: "Beschädigt",       color: "#a32d2d" },
    READY_TO_DEPART: { label: "Reisebereit",      color: "#2f9e54" },
    REFUELING:       { label: "Wird betankt",     color: "#2f9e8a" },
    REPAIRING:       { label: "Wird repariert",   color: "#6f7f96" },
};

// Events bekommen kräftigere, klar unterscheidbare Farben
const EVENT_VISUALS: Record<PendingEventKind, StatusVisual> = {
    rats:            { label: "Rattenbefall",        color: "#7d6a24" },
    storm:           { label: "Sturm",               color: "#5566cc" },
    obstacle:        { label: "Gefährliche Passage", color: "#d6791f" },
    treasure_hunt:   { label: "Schatzjagd",          color: "#c79a23" },
    arrival_docking: { label: "Manuelles Anlegen",   color: "#2f9e8a" },
    smuggle:         { label: "Schmuggelangebot",    color: "#b3439e" },
    customs:         { label: "Zollkontrolle",       color: "#d0592a" },
};

function resolveVisual(
    status: string,
    pendingEventLabel?: string,
    pendingEventKind?: PendingEventKind,
): StatusVisual {
    if (pendingEventKind) {
        const ev = EVENT_VISUALS[pendingEventKind];
        return { label: pendingEventLabel ?? ev.label, color: ev.color };
    }
    if (pendingEventLabel) {
        // Event ohne bekanntes kind -> generische Event-Farbe
        return { label: pendingEventLabel, color: "#c89b3c" };
    }
    // Fallback nur als Sicherheitsnetz – sollte nie greifen, da alle Enums abgedeckt sind
    return STATUS_VISUALS[status] ?? { label: status, color: "#7a5736" };
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
                                           pendingEventKind,
                                           urgent,
                                           onClick,
                                       }: ShipStatusCardProps) {
    const visual = resolveVisual(status, pendingEventLabel, pendingEventKind);
    const isEvent = Boolean(pendingEventKind || pendingEventLabel);
    const isActionable =
        isEvent ||
        status === "READY_TO_DEPART" ||
        status === "LOADING" ||
        status === "UNLOADING";

    return (
        <article
            className={`ship-status-card ${isActionable ? "actionable" : ""} ${isEvent ? "event-pending" : ""} ${urgent ? "urgent" : ""} ${onClick ? "clickable" : ""}`}
            style={{ "--status-color": visual.color } as CSSProperties}
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
                <span className="ship-status-badge">{visual.label}</span>
            </div>

            <div className="ship-status-body">
                <img src={iconUrl} alt={name} className="ship-status-icon" />
                <div className="ship-status-meta">
                    {shipClass && (
                        <div className="ship-status-line">
                            <span>Klasse</span>
                            <strong>{shipClass}</strong>
                        </div>
                    )}
                    {currentPortName && (
                        <div className="ship-status-line">
                            <span>Ort</span>
                            <strong>{currentPortName}</strong>
                        </div>
                    )}
                    {urgent && (
                        <div className="ship-status-action-hint">⚠ Tippen zum Entscheiden</div>
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