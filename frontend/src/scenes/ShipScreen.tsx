import { useEffect, useState } from "react";
import "../style/selectship.css";

interface PlayerShip {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    status: string;
    shipClass?: string;
    description?: string;
    maxSpeed?: number;
    maxCargoCapacity?: number;
    iconUrl?: string;
    currentPortId?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    AT_PORT:         { label: "Im Hafen",      color: "#4caf50" },
    EN_ROUTE:        { label: "Auf Reise",      color: "#ff9800" },
    IN_REGISTRATION: { label: "Registrierung",  color: "#9e9e9e" },
    DAMAGED:         { label: "Beschädigt",     color: "#f44336" },
    LOADING:         { label: "Lädt",           color: "#2196f3" },
    UNLOADING:       { label: "Entlädt",        color: "#2196f3" },
    REFUELING:       { label: "Tankt",          color: "#9c5d0d" },
    REPAIRING:       { label: "Repariert",      color: "#9c5d0d" },
};

const CLASS_LABELS: Record<string, { label: string; accent: string }> = {
    BUDGET:   { label: "Budget",   accent: "#7eb8a4" },
    STANDARD: { label: "Standard", accent: "#c89b3c" },
    PREMIUM:  { label: "Premium",  accent: "#b06030" },
};

function StatBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="stat-bar-track">
            <div
                className="stat-bar-fill"
                style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
            />
        </div>
    );
}

interface ShipScreenProps {
    onSelect: (ship: PlayerShip) => void;
    filterByPortId?: string;
}

export default function ShipScreen({ onSelect, filterByPortId }: ShipScreenProps) {
    const [ships, setShips] = useState<PlayerShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;

    useEffect(() => {
        if (!playerId) return;

        const sessionData = sessionStorage.getItem("currentSession");
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;

        if (!sessionId) return;

        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        })
            .then(res => res.json())
            .then(data => {
                const allShips: PlayerShip[] = data;
                const sorted = filterByPortId
                    ? allShips.filter(s => s.currentPortId === filterByPortId)
                    : [
                        ...allShips.filter(s => s.status === "AT_PORT"),
                        ...allShips.filter(s => s.status !== "AT_PORT"),
                    ];
                setShips(sorted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));


    }, [playerId]);

    return (
        <div className="ship-screen">
            <div className="ship-screen-inner">

                <div className="ship-screen-header">
                    <div className="ship-screen-header-ornament" />
                    <h2 className="ship-screen-title">Meine Flotte</h2>
                    <div className="ship-screen-header-ornament" />
                </div>

                {loading && (
                    <div className="ship-screen-status">
                        <span className="ship-loading-dot" />
                        <span className="ship-loading-dot" />
                        <span className="ship-loading-dot" />
                    </div>
                )}

                {!loading && ships.length === 0 && (
                    <div className="ship-empty">
                        <div className="ship-empty-icon"></div>
                        <p>Keine Schiffe in deiner Flotte.</p>
                        <p className="ship-empty-sub">Besuche den Schiffshändler!</p>
                    </div>
                )}

                <div className="ship-grid">
                    {!loading && ships.map(ship => {
                        const statusInfo = STATUS_LABELS[ship.status] ?? { label: ship.status, color: "#aaa" };
                        const classInfo  = CLASS_LABELS[ship.shipClass ?? ""] ?? { label: ship.shipClass ?? "", accent: "#c89b3c" };
                        const isHovered  = hoveredId === ship.id;
                        const isAtPort   = ship.status === "AT_PORT";

                        return (
                            <div
                                key={ship.id}
                                className={`ship-card-new${isHovered ? " hovered" : ""}${!isAtPort ? " ship-disabled" : ""}`}
                                onClick={() => isAtPort && onSelect(ship)}
                                onMouseEnter={() => setHoveredId(ship.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{ "--accent": classInfo.accent } as React.CSSProperties}
                            >
                                <div className="ship-class-badge" style={{ color: classInfo.accent, borderColor: classInfo.accent }}>
                                    {classInfo.label}
                                </div>

                                <div className="ship-image-wrap">
                                    <img
                                        src={ship.iconUrl ?? "/fallback-ship.png"}
                                        alt={ship.name}
                                        className="ship-img"
                                        onError={e => { (e.target as HTMLImageElement).src = "/fallback-ship.png"; }}
                                    />
                                    <div className="ship-img-glow" style={{ background: `radial-gradient(ellipse, ${classInfo.accent}44 0%, transparent 70%)` }} />
                                </div>

                                <div className="ship-card-body">
                                    <div className="ship-card-name">{ship.name}</div>

                                    {ship.description && (
                                        <div className="ship-card-desc-text">{ship.description}</div>
                                    )}

                                    <div className="ship-status-pill" style={{ background: `${statusInfo.color}22`, borderColor: statusInfo.color, color: statusInfo.color }}>
                                        <span className="ship-status-dot" style={{ background: statusInfo.color }} />
                                        {statusInfo.label}
                                    </div>

                                    <div className="ship-stats">
                                        <div className="ship-stat-row">
                                            <span className="ship-stat-label">Treibstoff</span>
                                            <span className="ship-stat-value">{ship.fuel.toFixed(0)}%</span>
                                        </div>
                                        <StatBar value={ship.fuel} color="#4a9fd4" />

                                        <div className="ship-stat-row">
                                            <span className="ship-stat-label">Zustand</span>
                                            <span className="ship-stat-value">{typeof ship.condition === "number" ? ship.condition.toFixed(0) : ship.condition}%</span>
                                        </div>
                                        <StatBar value={typeof ship.condition === "number" ? ship.condition : parseFloat(String(ship.condition))} color="#6abf69" />
                                    </div>

                                    {(ship.maxSpeed || ship.maxCargoCapacity) && (
                                        <div className="ship-extra-stats">
                                            {ship.maxSpeed && (
                                                <div className="ship-extra-stat">
                                                    <span>Geschw. </span>
                                                    <span>{ship.maxSpeed} kn</span>
                                                </div>
                                            )}
                                            {ship.maxCargoCapacity && (
                                                <div className="ship-extra-stat">
                                                    <span>Ladekapazität</span>
                                                    <span>{ship.maxCargoCapacity} t</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="ship-card-footer">
                                    {isAtPort ? (
                                        <div className="ship-select-btn" style={{ borderColor: classInfo.accent, color: classInfo.accent }}>
                                            Auswählen
                                        </div>
                                    ) : (
                                        <div className="ship-blocked-label">Nicht verfügbar</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}