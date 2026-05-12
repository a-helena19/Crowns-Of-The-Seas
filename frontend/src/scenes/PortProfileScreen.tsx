import { useEffect, useState } from "react";
import "../style/portProfile.css";

interface PortData {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface SessionCargoDTO {
    id: string;
    name: string;
    description: string;
    originPortId: string;
    originPortName: string;
    destinationPortId: string;
    destinationPortName: string;
    reward: number;
    capacity: number;
    cargoType: string;
    risk: number;
    cargoStatus: string;
    containsIllegal: boolean;
}

interface Props {
    port: PortData;
    onClose: () => void;
}

const PORT_INFO: Record<string, { country: string; flag: string; facts: [string, string] }> = {
    "Hamburg":     { country: "Deutschland",  flag: "🇩🇪", facts: ["Drittgrößter Hafen Europas", "Gegründet im Jahr 1189"] },
    "Rotterdam":   { country: "Niederlande",  flag: "🇳🇱", facts: ["Größter Hafen Europas", "Über 450 Mio. Tonnen/Jahr"] },
    "New York":    { country: "USA",          flag: "🇺🇸", facts: ["Historisches Gateway der USA", "Ellis Island in der Nähe"] },
    "Santos":      { country: "Brasilien",    flag: "🇧🇷", facts: ["Größter Hafen Südamerikas", "Wichtig für Kaffeeexport"] },
    "Kapstadt":    { country: "Südafrika",    flag: "🇿🇦", facts: ["Südlichster Großhafen Afrikas", "Am Fuß des Tafelbergs"] },
    "Mumbai":      { country: "Indien",       flag: "🇮🇳", facts: ["Geschäftigster Hafen Indiens", "Finanzmetropole Südasiens"] },
    "Singapur":    { country: "Singapur",     flag: "🇸🇬", facts: ["Zweitgrößter Containerhafen weltweit", "Knotenpunkt Südostasiens"] },
    "Shanghai":    { country: "China",        flag: "🇨🇳", facts: ["Größter Containerhafen der Welt", "Am Yangtze-Delta gelegen"] },
    "Sydney":      { country: "Australien",   flag: "🇦🇺", facts: ["Natürlicher Tiefwasserhafen", "Bekannt für die Harbour Bridge"] },
    "Los Angeles": { country: "USA",          flag: "🇺🇸", facts: ["Größter Hafen der USA", "Drehkreuz für Pazifikhandel"] },
};

const TYPE_LABELS: Record<string, string> = {
    GENERAL_GOODS: "General",
    FOOD: "Food",
    INDUSTRIAL_GOODS: "Industrial",
    ELECTRONICS: "Electronics",
    FRAGILE: "Fragile",
    HAZARDOUS: "Hazardous",
    LUXURY_GOODS: "Luxury",
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

const riskLabel = (r: number) => r < 0.1 ? "Niedrig" : r < 0.25 ? "Mittel" : r < 0.4 ? "Hoch" : "Extrem";
const riskClass = (r: number) => r < 0.1 ? "risk-low" : r < 0.25 ? "risk-medium" : r < 0.4 ? "risk-high" : "risk-extreme";

export default function PortProfileScreen({ port, onClose }: Props) {
    const [cargos, setCargos] = useState<SessionCargoDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? (JSON.parse(sessionData) as { id: string }).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? JSON.parse(userData).id : null;

    useEffect(() => {
        if (!sessionId) { setLoading(false); return; }
        fetch(`/api/cargo/${sessionId}/available?portId=${port.id}&playerId=${playerId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json() as Promise<SessionCargoDTO[]>)
            .then((data) => {
                setCargos(data.filter((c) => c.originPortId === port.id));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sessionId, port.id, token]);

    const info = PORT_INFO[port.name];

    return (
        <div className="port-profile-overlay">
            <div className="port-profile-panel">
                <button className="port-profile-close" onClick={onClose} type="button">✕</button>

                <div className="port-profile-header">
                    <div className="port-profile-icon">⚓</div>
                    <div>
                        <h1 className="port-profile-name">{port.name}</h1>
                        {info && (
                            <div className="port-profile-country">
                                {info.flag} {info.country}
                            </div>
                        )}
                    </div>
                </div>

                {info && (
                    <div className="port-profile-facts">
                        <div className="port-profile-fact">
                            <span className="port-profile-fact-icon">📌</span>
                            {info.facts[0]}
                        </div>
                        <div className="port-profile-fact">
                            <span className="port-profile-fact-icon">📌</span>
                            {info.facts[1]}
                        </div>
                    </div>
                )}

                <div className="port-profile-section-title">
                    Aktuelle Frachtangebote
                    {!loading && <span className="port-profile-cargo-count">({cargos.length})</span>}
                </div>

                {loading ? (
                    <div className="port-profile-empty">Lade Frachtangebote…</div>
                ) : cargos.length === 0 ? (
                    <div className="port-profile-empty">
                        Momentan keine Fracht verfügbar.
                        <br />
                        <span style={{ fontSize: 11, opacity: 0.6 }}>Neue Angebote erscheinen mit der Zeit.</span>
                    </div>
                ) : (
                    <div className="port-profile-cargo-list">
                        {cargos.map((c) => (
                            <div key={c.id} className="port-profile-cargo-item">
                                <div className="port-profile-cargo-row">
                                    <span className="port-profile-cargo-name">{c.name}</span>
                                    <span className="port-profile-cargo-reward">{Number(c.reward).toLocaleString("de-DE")} T</span>
                                </div>
                                <div className="port-profile-cargo-sub">
                                    <span
                                        className="port-profile-cargo-type"
                                        style={{ background: TYPE_COLORS[c.cargoType] + "22", color: TYPE_COLORS[c.cargoType] }}
                                    >
                                        {TYPE_LABELS[c.cargoType] ?? c.cargoType}
                                    </span>
                                    <span className="port-profile-cargo-route">
                                        {c.originPortName} → {c.destinationPortName}
                                    </span>
                                    <span className={`port-profile-cargo-risk ${riskClass(c.risk)}`}>
                                        Risiko: {riskLabel(c.risk)}
                                    </span>
                                </div>
                                {c.description && (
                                    <div className="port-profile-cargo-desc">{c.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
