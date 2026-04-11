import { useState } from "react";
import "../style/cargo.css";

interface Cargo {
    from: string;
    to: string;
    profit: string;
    duration: string;
    risk: string;
    destinationPortId: string;
}

const CARGO_DATA: Cargo[] = [
    {
        from: "Hamburg",
        to: "New York",
        profit: "12.000",
        duration: "5 Tage",
        risk: "Mittel",
        destinationPortId: "fa9244ef-f24e-4a8d-9536-61d4cc61c780",
    },
    {
        from: "Lisbon",
        to: "Rio de Janeiro",
        profit: "18.500",
        duration: "9 Tage",
        risk: "Niedrig",
        destinationPortId: "fa9244ef-f24e-4a8d-9536-61d4cc61c780",
    },
    {
        from: "Shanghai",
        to: "San Francisco",
        profit: "25.000",
        duration: "14 Tage",
        risk: "Hoch",
        destinationPortId: "fa9244ef-f24e-4a8d-9536-61d4cc61c780"
    },
];

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

    const [selectedCargo, setSelectedCargo] = useState(CARGO_DATA[0]);

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

                    {CARGO_DATA.map((c) => {
                        const active = c.destinationPortId === selectedCargo.destinationPortId;

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

                </div>

            </div>
            </div>
        </div>
    );
}