import "../style/panel.css";

const TYPE_LABELS: Record<string, string> = {
    GENERAL_GOODS: "General Goods",
    FOOD: "Food",
    INDUSTRIAL_GOODS: "Industrial",
    ELECTRONICS: "Electronics",
    FRAGILE: "Fragile",
    HAZARDOUS: "Hazardous",
    LUXURY_GOODS: "Luxury Goods",
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

export default function InfoPanel({ cargo, ship }: { cargo?: any; ship?: any }) {
    if (!cargo && !ship) return null;

    return (
        <div className="info-panel">
            {ship && (
                <div className="info-section">
                    <div className="info-section-title">🚢 Ausgewähltes Schiff</div>
                    <div className="info-row"><span>Name</span><strong>{ship.name}</strong></div>
                    <div className="info-row">
                        <span>Treibstoff</span>
                        <strong>{typeof ship.fuel === "number" ? ship.fuel.toFixed(0) : ship.fuel}%</strong>
                    </div>
                    <div className="info-row">
                        <span>Zustand</span>
                        <strong>{typeof ship.condition === "number" ? ship.condition.toFixed(0) : ship.condition}%</strong>
                    </div>
                    {ship.maxCargoCapacity && (
                        <div className="info-row"><span>Kapazität</span><strong>{ship.maxCargoCapacity} t</strong></div>
                    )}
                </div>
            )}

            {cargo && (
                <div className="info-section">
                    <div className="info-section-title">📦 Ausgewählte Fracht</div>
                    <div className="info-row"><span>Name</span><strong>{cargo.name}</strong></div>
                    <div className="info-row"><span>Von</span><strong>{cargo.originPortName}</strong></div>
                    <div className="info-row"><span>Nach</span><strong>{cargo.destinationPortName}</strong></div>
                    <div className="info-row">
                        <span>Belohnung</span>
                        <strong style={{ color: "#b89b5e" }}>{Number(cargo.reward).toLocaleString("de-DE")} G</strong>
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
                </div>
            )}
        </div>
    );
}
