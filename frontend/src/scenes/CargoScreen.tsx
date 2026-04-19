import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import "../style/cargo.css";

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

export default function CargoScreen({
                                        onSelect,
                                        currentPortId,
                                    }: {
    onSelect: (cargo: SessionCargoDTO) => void;
    currentPortId: string | null;
}) {
    const [cargos, setCargos] = useState<SessionCargoDTO[]>([]);
    const [selected, setSelected] = useState<SessionCargoDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const stompRef = useRef<Client | null>(null);

    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    const filterByPort = (list: SessionCargoDTO[]) => {
        if (!currentPortId) return list;
        return list.filter((c) => c.originPortId === currentPortId);
    };

    useEffect(() => {
        if (!sessionId || !currentPortId) { setLoading(false); return; }
        fetch(`/api/cargo/${sessionId}/available?portId=${currentPortId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        })
            .then((r) => r.json())
            .then((data: SessionCargoDTO[]) => {
                const filtered = filterByPort(data);
                setCargos(filtered);
                if (filtered.length > 0) setSelected(filtered[0]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sessionId, currentPortId]);

    useEffect(() => {
        if (!sessionId) return;
        const token = localStorage.getItem("auth_token");
        const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        client.connect(headers, () => {
            stompRef.current = client;
            client.subscribe(`/topic/session/${sessionId}/cargo`, (msg) => {
                const event = JSON.parse(msg.body);
                const all: SessionCargoDTO[] = event.availableCargos ?? [];
                const filtered = filterByPort(all);
                setCargos(filtered);
                setSelected((prev) => filtered.find((c) => c.id === prev?.id) ?? (filtered[0] ?? null));
            });
        }, () => {});
        return () => { if (client.connected) client.disconnect(() => {}); };
    }, [sessionId, currentPortId]);

    const riskLabel = (r: number) => r < 0.1 ? "Niedrig" : r < 0.25 ? "Mittel" : r < 0.4 ? "Hoch" : "Extrem";
    const riskClass = (r: number) => r < 0.1 ? "risk-low" : r < 0.25 ? "risk-medium" : r < 0.4 ? "risk-high" : "risk-extreme";

    if (loading)
        return <div className="cargo-screen"><p style={{ color: "#aaa", textAlign: "center", marginTop: 80 }}>Lade Frachtbörse…</p></div>;

    return (
        <div className="cargo-screen">
            <div className="cargo-container">
                <div className="cargo-header">
                    <h2 className="cargo-title">⚓ Frachtbörse</h2>
                </div>
                <div className="cargo-layout">
                    <div className="cargo-list">
                        <div className="cargo-list-header">Verfügbare Frachten ({cargos.length})</div>
                        {cargos.length === 0 && (
                            <div style={{ color: "#aaa", padding: "20px", textAlign: "center", fontSize: "13px" }}>
                                Momentan keine Fracht verfügbar.<br />
                                <span style={{ fontSize: 11, opacity: 0.6 }}>Neue Angebote erscheinen mit der Zeit.</span>
                            </div>
                        )}
                        {cargos.map((c) => (
                            <div key={c.id} onClick={() => setSelected(c)}
                                 className={`cargo-item ${selected?.id === c.id ? "active" : ""}`}>
                                <div className="cargo-item-row">
                                    <span className="cargo-item-name">{c.name}</span>
                                    <span className="cargo-item-profit">{Number(c.reward).toLocaleString("de-DE")} G</span>
                                </div>
                                <div className="cargo-item-sub">
                                    <span style={{ background: TYPE_COLORS[c.cargoType] + "22", color: TYPE_COLORS[c.cargoType], padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                                        {TYPE_LABELS[c.cargoType] ?? c.cargoType}
                                    </span>
                                    <span>{c.originPortName} → {c.destinationPortName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cargo-detail">
                        {selected ? (
                            <>
                                <div className="cargo-detail-title">{selected.name}</div>
                                <div style={{ color: "#7a6a4a", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{selected.description}</div>
                                <div className="cargo-route">
                                    <div className="cargo-port">
                                        <div className="cargo-port-icon">⚓</div>
                                        <div className="cargo-port-name">{selected.originPortName}</div>
                                        <div style={{ fontSize: 10, color: "#999" }}>Abfahrt</div>
                                    </div>
                                    <div className="cargo-route-line" />
                                    <div className="cargo-port">
                                        <div className="cargo-port-icon">🏴</div>
                                        <div className="cargo-port-name">{selected.destinationPortName}</div>
                                        <div style={{ fontSize: 10, color: "#999" }}>Ziel</div>
                                    </div>
                                </div>
                                <div className="cargo-stats">
                                    <div className="cargo-stat"><div style={{ fontSize: 20, marginBottom: 6 }}>💰</div><span>Belohnung</span><strong>{Number(selected.reward).toLocaleString("de-DE")} G</strong></div>
                                    <div className="cargo-stat"><div style={{ fontSize: 20, marginBottom: 6 }}>📦</div><span>Kapazität</span><strong>{selected.capacity} t</strong></div>
                                    <div className="cargo-stat"><div style={{ fontSize: 20, marginBottom: 6 }}>⚠️</div><span>Risiko</span><strong className={riskClass(selected.risk)}>{riskLabel(selected.risk)}</strong></div>
                                    <div className="cargo-stat"><div style={{ fontSize: 20, marginBottom: 6 }}>🏷️</div><span>Typ</span><strong style={{ color: TYPE_COLORS[selected.cargoType] }}>{TYPE_LABELS[selected.cargoType]}</strong></div>
                                </div>
                                <button className="cargo-btn" onClick={() => onSelect(selected)}>
                                    Fracht auswählen
                                </button>
                            </>
                        ) : (
                            <div style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>Wähle ein Frachtangebot aus.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
