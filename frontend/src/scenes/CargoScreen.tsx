import { useState, useEffect } from "react";
import "../style/cargo.css";

interface Cargo {
    from: string;
    to: string;
    profit: string;
    duration: string;
    risk: string;
    destinationPortId: string;
}

interface Port {
    id: string;
    name: string;
    x: number;
    y: number;
}

const RISK_LEVELS = ["Niedrig", "Mittel", "Hoch"];

function buildCargoFromPorts(ports: Port[]): Cargo[] {
    if (ports.length < 2) return [];
    // Erste Port = Starthafen, generiere Routen zu allen anderen
    const origin = ports[0];
    return ports.slice(1).map((dest, i) => {
        const dx = dest.x - origin.x;
        const dy = dest.y - origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const profit = Math.round(dist * 150);
        const days = Math.ceil(dist / 5);
        return {
            from: origin.name,
            to: dest.name,
            profit: profit.toLocaleString("de-DE"),
            duration: `${days} Tage`,
            risk: RISK_LEVELS[i % 3],
            destinationPortId: dest.id,
        };
    });
}

const ScaleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18M6 7h12M6 7l-3 5h6l-3-5ZM18 7l-3 5h6l-3-5Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const ClockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const WarningIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 4l9 16H3L12 4Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

export default function CargoScreen({ onSelect }: { onSelect: (cargo: Cargo) => void }) {

    const [cargoData, setCargoData] = useState<Cargo[]>([]);
    const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);

    useEffect(() => {
        const ports: Port[] = window.__latestPorts ?? [];
        const data = buildCargoFromPorts(ports);
        setCargoData(data);
        if (data.length > 0) setSelectedCargo(data[0]);
    }, []);

    return (
        <div className="cargo-screen">
            <div className="cargo-container">

            <div className="cargo-header">
                <h2 className="cargo-title">The Cargo Market</h2>

            </div>

            <div className="cargo-layout">
                <div className="cargo-list">

                    <div className="cargo-list-header">
                        Available Charters
                    </div>

                    {cargoData.map((c) => {
                        const active = selectedCargo?.destinationPortId === c.destinationPortId;

                        return (
                            <div
                                key={c.destinationPortId}
                                onClick={() => setSelectedCargo(c)}
                                className={`cargo-item ${active ? "active" : ""}`}
                            >
                                <div className="cargo-item-row">
                                    <span className="cargo-item-name">
                                        {c.from} → {c.to}
                                    </span>
                                    <span className="cargo-item-profit">
                                        {c.profit} G
                                    </span>
                                </div>

                                <div className="cargo-item-sub">
                                    <span>To {c.to}</span>
                                    <span className={`risk-${c.risk.toLowerCase()}`}>
                                        {c.risk} Risk
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                </div>
                <div className="cargo-detail">
                    {selectedCargo ? (
                        <>
                            <div className="cargo-detail-title">
                                {selectedCargo.from} → {selectedCargo.to}
                            </div>

                            <div className="cargo-route">
                                <div className="cargo-port">{selectedCargo.from}</div>
                                <div className="cargo-route-line" />
                                <div className="cargo-port">{selectedCargo.to}</div>
                            </div>

                            <div className="cargo-stats">
                                <div className="cargo-stat">
                                    <ScaleIcon />
                                    <span>Profit</span>
                                    <strong>{selectedCargo.profit} G</strong>
                                </div>
                                <div className="cargo-stat">
                                    <ClockIcon />
                                    <span>Duration</span>
                                    <strong>{selectedCargo.duration}</strong>
                                </div>
                                <div className="cargo-stat">
                                    <WarningIcon />
                                    <span>Risk</span>
                                    <strong>{selectedCargo.risk}</strong>
                                </div>
                            </div>

                            <button
                                className="cargo-btn"
                                onClick={() => onSelect(selectedCargo)}
                            >
                                Sign Contract
                            </button>
                        </>
                    ) : (
                        <div style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
                            Keine Häfen geladen.
                        </div>
                    )}
                </div>

            </div>
            </div>
        </div>
    );
}