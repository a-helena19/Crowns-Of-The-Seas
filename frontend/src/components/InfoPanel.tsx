import "../style/panel.css";

const TYPE_LABELS: Record<string, string> = {
    GENERAL_GOODS: "Stückgut",
    FOOD: "Lebensmittel",
    INDUSTRIAL_GOODS: "Industriegüter",
    ELECTRONICS: "Elektronik",
    FRAGILE: "Zerbrechlich",
    HAZARDOUS: "Gefahrgut",
    LUXURY_GOODS: "Luxusgüter",
};

const TYPE_COLORS: Record<string, string> = {
    GENERAL_GOODS: "#7a9b6a",
    FOOD: "#c0874a",
    INDUSTRIAL_GOODS: "#6a7fa0",
    ELECTRONICS: "#6a5fb0",
    FRAGILE: "#b08060",
    HAZARDOUS: "#b04040",
    LUXURY_GOODS: "#a07030",
};

const SPEED_LABELS: Record<string, string> = {
    "0.250": "Langsam",
    "0.400": "Gemütlich",
    "0.600": "Normal",
    "0.800": "Schnell",
    "1.000": "Volldampf",
};

function speedLabel(s: number): string {
    const key = s.toFixed(3);
    return SPEED_LABELS[key] ?? `${(s * 100).toFixed(0)}%`;
}

export interface InfoPanelCargo {
    name: string;
    originPortName: string;
    destinationPortName: string;
    reward: number;
    capacity: number;
    cargoType?: string;
}

export interface InfoPanelShip {
    name: string;
    fuel: number;
    condition: number;
    maxCargoCapacity?: number;
}

interface InfoPanelProps {
    cargo?: InfoPanelCargo | null;
    ship?: InfoPanelShip | null;
    speedSetting?: number;
}

export default function InfoPanel({ cargo, ship, speedSetting }: InfoPanelProps) {
    if (!cargo && !ship) return null;

    return (
        <div className="info-panel">
            {ship && (
                <div className="info-section">
                    <div className="info-section-title">Ausgewähltes Schiff</div>
                    <div className="info-row"><span>Name</span><strong>{ship.name}</strong></div>
                    <div className="info-row">
                        <span>Treibstoff</span>
                        <strong>{ship.fuel.toFixed(0)}%</strong>
                    </div>
                    <div className="info-row">
                        <span>Zustand</span>
                        <strong>{ship.condition.toFixed(0)}%</strong>
                    </div>
                    {ship.maxCargoCapacity !== undefined && (
                        <div className="info-row"><span>Kapazität</span><strong>{ship.maxCargoCapacity} t</strong></div>
                    )}
                </div>
            )}

            {cargo && (
                <div className="info-section">
                    <div className="info-section-title">Ausgewählte Fracht</div>
                    <div className="info-row"><span>Name</span><strong>{cargo.name}</strong></div>
                    <div className="info-row"><span>Von</span><strong>{cargo.originPortName}</strong></div>
                    <div className="info-row"><span>Nach</span><strong>{cargo.destinationPortName}</strong></div>
                    <div className="info-row">
                        <span>Belohnung</span>
                        <strong style={{ color: "#b89b5e" }}>{Number(cargo.reward).toLocaleString("de-DE")} T</strong>
                    </div>
                    <div className="info-row"><span>Kapazität</span><strong>{cargo.capacity} t</strong></div>
                    {cargo.cargoType && (
                        <div className="info-row">
                            <span>Typ</span>
                            <strong style={{ color: TYPE_COLORS[cargo.cargoType] }}>
                                {TYPE_LABELS[cargo.cargoType] ?? cargo.cargoType}
                            </strong>
                        </div>
                    )}
                    {speedSetting !== undefined && (
                        <div className="info-row">
                            <span>Tempo</span>
                            <strong style={{ color: "#8a9fd4" }}>{speedLabel(speedSetting)}</strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
