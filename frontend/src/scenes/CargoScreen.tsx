import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import "../style/cargo.css";

interface SessionCargoDTO {
    id: string; name: string; description: string;
    originPortName: string; destinationPortName: string;
    destinationPortId: string;
    reward: number; capacity: number; cargoType: string; risk: number;
    status: string; containsIllegal: boolean;
}

const TYPE_LABELS: Record<string,string> = {
    GENERAL_GOODS:"General", FOOD:"Food", INDUSTRIAL_GOODS:"Industrial",
    ELECTRONICS:"Electronics", FRAGILE:"Fragile", HAZARDOUS:"Hazardous", LUXURY_GOODS:"Luxury"
};
const TYPE_COLORS: Record<string,string> = {
    GENERAL_GOODS:"#7a9b6a", FOOD:"#c0874a", INDUSTRIAL_GOODS:"#6a7fa0",
    ELECTRONICS:"#6a5fb0", FRAGILE:"#b08060", HAZARDOUS:"#b04040", LUXURY_GOODS:"#a07030"
};

export default function CargoScreen({ onSelect }: { onSelect: (c: any) => void }) {
    const [cargos, setCargos] = useState<SessionCargoDTO[]>([]);
    const [selected, setSelected] = useState<SessionCargoDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{text: string, ok: boolean} | null>(null);
    const stompRef = useRef<Client | null>(null);

    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;
    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;

    // Initial fetch
    useEffect(() => {
        if (!sessionId) return;
        fetch(`/api/cargo/${sessionId}/available`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` }
        })
            .then(r => r.json())
            .then((data: SessionCargoDTO[]) => {
                setCargos(data); if (data.length > 0) setSelected(data[0]); setLoading(false);
            }).catch(() => setLoading(false));
    }, [sessionId]);

    // WebSocket subscription for live market updates
    useEffect(() => {
        if (!sessionId) return;
        const token = localStorage.getItem('auth_token');
        const wsUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080/ws' : '/ws';
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (playerId) headers['playerId'] = playerId;

        client.connect(headers, () => {
            stompRef.current = client;

            // Market updates — available cargos list
            client.subscribe(`/topic/session/${sessionId}/cargo`, (msg) => {
                const event = JSON.parse(msg.body);
                const updated: SessionCargoDTO[] = event.availableCargos ?? [];
                setCargos(updated);
                setSelected(prev => updated.find(c => c.id === prev?.id) ?? (updated[0] ?? null));
            });

            // Personal reply — accepted or error
            client.subscribe(`/user/queue/cargo/accepted`, (msg) => {
                const accepted = JSON.parse(msg.body);
                setMessage({ text: `✓ Contract signed: ${accepted.name}`, ok: true });
                // Forward to HarborScene as selected cargo (keeps destinationPortId for travel)
                onSelect({ destinationPortId: accepted.destinationPortId });
            });
            client.subscribe(`/user/queue/cargo/error`, (msg) => {
                const text = msg.body.includes("TAKEN")
                    ? "⚡ This cargo was just taken by another captain!"
                    : msg.body.includes("CAPACITY")
                        ? "⛵ Your ship is too small for this cargo."
                        : "Something went wrong. Try again.";
                setMessage({ text, ok: false });
            });
        }, () => {});

        return () => { client.connected && client.disconnect(() => {}); };
    }, [sessionId, playerId]);

    const handleAccept = () => {
        if (!selected || !stompRef.current?.connected) return;
        // We need the playerShipId — get from sessionStorage or localStorage
        const shipData = sessionStorage.getItem('currentShip');
        const playerShipId = shipData ? JSON.parse(shipData).id : null;
        if (!playerShipId) {
            setMessage({ text: "Please select a ship first!", ok: false });
            return;
        }
        setMessage(null);
        stompRef.current.send(
            `/app/cargo/${sessionId}/accept`, {},
            JSON.stringify({ sessionCargoId: selected.id, playerShipId })
        );
    };

    const riskLabel = (r: number) => r < 0.1 ? "Low" : r < 0.25 ? "Medium" : r < 0.4 ? "High" : "Extreme";
    const riskClass = (r: number) => r < 0.1 ? "risk-low" : r < 0.25 ? "risk-medium" : r < 0.4 ? "risk-high" : "risk-extreme";

    if (loading) return <div className="cargo-screen"><p style={{color:"#aaa",textAlign:"center",marginTop:80}}>Loading market…</p></div>;

    return (
        <div className="cargo-screen">
            <div className="cargo-container">
                <div className="cargo-header">
                    <h2 className="cargo-title">The Cargo Market</h2>
                    {message && (
                        <div className="cargo-message" style={{color: message.ok ? "#4caf50" : "#f44336",
                            borderColor: message.ok ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)",
                            background: message.ok ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)"}}>
                            {message.text}
                        </div>
                    )}
                </div>
                <div className="cargo-layout">
                    <div className="cargo-list">
                        <div className="cargo-list-header">Available Charters ({cargos.length})</div>
                        {cargos.length === 0 && <div style={{color:"#aaa",padding:"20px",textAlign:"center",fontSize:"13px"}}>No cargo available right now.</div>}
                        {cargos.map(c => (
                            <div key={c.id} onClick={() => setSelected(c)}
                                 className={`cargo-item ${selected?.id === c.id ? "active" : ""}`}>
                                <div className="cargo-item-row">
                                    <span className="cargo-item-name">{c.name}</span>
                                    <span className="cargo-item-profit">{Number(c.reward).toLocaleString("de-DE")} G</span>
                                </div>
                                <div className="cargo-item-sub">
                                    <span style={{background:TYPE_COLORS[c.cargoType]+"22",color:TYPE_COLORS[c.cargoType],
                                        padding:"1px 6px",borderRadius:3,fontSize:10,fontWeight:"bold",letterSpacing:1}}>
                                        {TYPE_LABELS[c.cargoType] ?? c.cargoType}
                                    </span>
                                    <span>{c.originPortName} → {c.destinationPortName}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cargo-detail">
                        {selected ? (<>
                            <div className="cargo-detail-title">{selected.name}</div>
                            <div style={{color:"#7a6a4a",fontSize:13,marginBottom:20,lineHeight:1.6}}>{selected.description}</div>
                            <div className="cargo-route">
                                <div className="cargo-port">
                                    <div className="cargo-port-icon">⚓</div>
                                    <div className="cargo-port-name">{selected.originPortName}</div>
                                    <div style={{fontSize:10,color:"#999"}}>Origin</div>
                                </div>
                                <div className="cargo-route-line" />
                                <div className="cargo-port">
                                    <div className="cargo-port-icon">🏴</div>
                                    <div className="cargo-port-name">{selected.destinationPortName}</div>
                                    <div style={{fontSize:10,color:"#999"}}>Destination</div>
                                </div>
                            </div>
                            <div className="cargo-stats">
                                <div className="cargo-stat"><div style={{fontSize:20,marginBottom:6}}>💰</div><span>Reward</span><strong>{Number(selected.reward).toLocaleString("de-DE")} G</strong></div>
                                <div className="cargo-stat"><div style={{fontSize:20,marginBottom:6}}>📦</div><span>Capacity</span><strong>{selected.capacity} t</strong></div>
                                <div className="cargo-stat"><div style={{fontSize:20,marginBottom:6}}>⚠️</div><span>Risk</span><strong className={riskClass(selected.risk)}>{riskLabel(selected.risk)}</strong></div>
                                <div className="cargo-stat"><div style={{fontSize:20,marginBottom:6}}>🏷️</div><span>Type</span><strong style={{color:TYPE_COLORS[selected.cargoType]}}>{TYPE_LABELS[selected.cargoType]}</strong></div>
                            </div>
                            <button className="cargo-btn" onClick={handleAccept}>Sign Contract</button>
                        </>) : (
                            <div style={{color:"#aaa",textAlign:"center",padding:"40px"}}>Select a cargo offer to view details.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}