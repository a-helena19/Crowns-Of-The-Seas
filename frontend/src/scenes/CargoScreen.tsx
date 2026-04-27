import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import "../style/cargo.css";
import { useTravelDuration } from "./TravelDurationInfo";

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
    expiresAtTick: number;
    lifetimeTicks: number;
}

interface SpeedOption {
    speedSetting: number;
    label: string;
    fuelRequiredAbsolute: number;
    fuelRequiredPercent: number;
    canAfford: boolean;
    possible: boolean;
}

interface FuelEstimate {
    currentFuelPercent: number;
    currentFuelAbsolute: number;
    maxFuel: number;
    distance: number;
    speedOptions: SpeedOption[];
}

interface CargoMarketEvent {
    availableCargos?: SessionCargoDTO[];
}

interface ShipPositionEventPayload {
    currentTick: number;
    ships: Array<{
        playerShipId: string;
        status: "EN_ROUTE" | "AT_PORT";
    }>;
}

interface ApiErrorResponse {
    error?: string;
    message?: string;
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

const SPEED_SETTINGS = [0.25, 0.4, 0.6, 0.8, 1.0];

interface Props {
    onTravelStarted: () => void;
    currentPortId: string | null;
    playerShipId: string | null;
}

export default function CargoScreen({ onTravelStarted, currentPortId, playerShipId }: Props) {
    const [cargos, setCargos] = useState<SessionCargoDTO[]>([]);
    const [selected, setSelected] = useState<SessionCargoDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const stompRef = useRef<Client | null>(null);

    const [speedIndex, setSpeedIndex] = useState(2);
    const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [fuelError, setFuelError] = useState<string | null>(null);

    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [shipInTransit, setShipInTransit] = useState(false);

    // Aktueller Tick fuer die Expiry-Anzeige der Cargos.
    // Liest initial den letzten Tick aus dem Window-Cache und reagiert auf neue Ticks
    // (siehe useGameSessionWebSocket -> 'backend-tick' Event).
    const [currentTick, setCurrentTick] = useState<number>(window.__latestTick?.currentTick ?? 0);
    useEffect(() => {
        const onTick = (e: Event) => {
            const detail = (e as CustomEvent<{ currentTick: number }>).detail;
            setCurrentTick(detail.currentTick);
        };
        window.addEventListener("backend-tick", onTick);
        return () => window.removeEventListener("backend-tick", onTick);
    }, []);

    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? (JSON.parse(sessionData) as { id: string }).id : null;
    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? (JSON.parse(userData) as { id: string }).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerShipId) {
            setShipInTransit(false);
            return;
        }

        const readTransitState = (ships: Array<{ playerShipId: string; status: "EN_ROUTE" | "AT_PORT" }>) => {
            const me = ships.find((s) => s.playerShipId === playerShipId);
            setShipInTransit(me?.status === "EN_ROUTE");
        };

        if (window.__latestShips) {
            readTransitState(window.__latestShips.map((s) => ({ playerShipId: s.playerShipId, status: s.status })));
        }

        const onShipPositions = (evt: Event) => {
            const payload = (evt as CustomEvent<ShipPositionEventPayload>).detail;
            readTransitState(payload.ships);
        };
        window.addEventListener("backend-ship-positions", onShipPositions);
        return () => window.removeEventListener("backend-ship-positions", onShipPositions);
    }, [playerShipId]);

    const filterByPort = useCallback((list: SessionCargoDTO[]) => {
        if (!currentPortId) return list;
        return list.filter((c) => c.originPortId === currentPortId);
    }, [currentPortId]);

    // Initialer Fetch
    useEffect(() => {
        if (!sessionId || !currentPortId) { setLoading(false); return; }
        fetch(`/api/cargo/${sessionId}/available?portId=${currentPortId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json() as Promise<SessionCargoDTO[]>)
            .then((data) => {
                const filtered = filterByPort(data);
                setCargos(filtered);
                if (filtered.length > 0) setSelected((prev) => prev ?? filtered[0]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sessionId, currentPortId, token, filterByPort]);

    // Live-Updates der Frachtbörse
    useEffect(() => {
        if (!sessionId) return;
        const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        client.connect(headers, () => {
            stompRef.current = client;
            client.subscribe(`/topic/session/${sessionId}/cargo`, (msg) => {
                const event = JSON.parse(msg.body) as CargoMarketEvent;
                const all: SessionCargoDTO[] = event.availableCargos ?? [];
                const filtered = filterByPort(all);
                setCargos(filtered);
                setSelected((prev) => {
                    if (prev && filtered.some((c) => c.id === prev.id)) return prev;
                    if (prev) {
                        setStartError("Diese Fracht wurde gerade von einem anderen Kapitän übernommen.");
                    }
                    return filtered[0] ?? null;
                });
            });
        }, () => {});
        return () => { if (client.connected) client.disconnect(() => {}); };
    }, [sessionId, token, filterByPort]);

    // Treibstoff-Schätzung
    useEffect(() => {
        if (!selected || !playerShipId || !playerId || !sessionId || !currentPortId || shipInTransit) {
            setFuelEstimate(null);
            return;
        }

        let cancelled = false;
        setEstimateLoading(true);
        setFuelError(null);

        fetch(`/api/travels/fuel-estimate?playerId=${playerId}&sessionId=${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ playerShipId, sessionCargoId: selected.id }),
        })
            .then((res) => res.ok ? (res.json() as Promise<FuelEstimate>) : Promise.reject())
            .then((data) => {
                if (cancelled) return;
                setFuelEstimate(data);
                const affordable = data.speedOptions.filter((o) => o.canAfford);
                if (affordable.length > 0) {
                    const last = affordable[affordable.length - 1];
                    const bestIdx = SPEED_SETTINGS.indexOf(last.speedSetting);
                    setSpeedIndex(bestIdx >= 0 ? bestIdx : 2);
                } else {
                    setSpeedIndex(0);
                }
            })
            .catch(() => { if (!cancelled) setFuelEstimate(null); })
            .finally(() => { if (!cancelled) setEstimateLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id, playerShipId, playerId, sessionId, token, currentPortId, shipInTransit]);

    const durationOptions = useTravelDuration({
        playerShipId: currentPortId && !shipInTransit ? playerShipId : null,
        sessionCargoId: selected?.id ?? null,
        playerId,
        sessionId,
        token,
    });
    const durationBySpeed = Object.fromEntries(durationOptions.map((o) => [o.speedSetting, o.durationTicks]));

    const currentSpeedOpt = fuelEstimate?.speedOptions[speedIndex] ?? null;
    const canAfford = !fuelEstimate || (currentSpeedOpt?.canAfford ?? false);
    const hasNoAffordableOption = fuelEstimate != null && fuelEstimate.speedOptions.every((o) => !o.canAfford);

    async function handleStartTravel() {
        if (!selected) return;
        if (!playerShipId) {
            setStartError("Bitte zuerst ein Schiff auswählen.");
            return;
        }
        if (!playerId || !sessionId) {
            setStartError("Session oder Spieler nicht gefunden.");
            return;
        }
        if (hasNoAffordableOption) {
            setFuelError("Nicht genug Treibstoff für diese Fracht.");
            return;
        }
        if (!canAfford) {
            setFuelError("Nicht genug Treibstoff für dieses Speed-Setting.");
            return;
        }

        const speedSetting = SPEED_SETTINGS[speedIndex];
        setStarting(true);
        setStartError(null);
        setFuelError(null);

        try {
            const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    playerShipId,
                    destinationPortId: selected.destinationPortId,
                    sessionCargoId: selected.id,
                    speedSetting,
                }),
            });

            let data: ApiErrorResponse | null = null;
            const text = await response.text();
            try { data = text ? (JSON.parse(text) as ApiErrorResponse) : null; } catch { data = null; }

            if (!response.ok) {
                const err = data?.error ?? "";
                if (err === "CARGO_TAKEN") {
                    setSelected(null);
                    setStartError("Diese Fracht wurde soeben von einem anderen Kapitän übernommen. Wähle eine neue Fracht.");
                } else if (err === "CAPACITY_EXCEEDED") {
                    setStartError("Dein Schiff ist zu klein für diese Fracht.");
                } else if (err === "INSUFFICIENT_FUEL") {
                    setStartError(data?.message ?? "Nicht genug Treibstoff.");
                } else {
                    setStartError(data?.message ?? "Reise konnte nicht gestartet werden.");
                }
                return;
            }

            onTravelStarted();
        } catch {
            setStartError("Verbindungsfehler.");
        } finally {
            setStarting(false);
        }
    }

    const riskLabel = (r: number) => r < 0.1 ? "Niedrig" : r < 0.25 ? "Mittel" : r < 0.4 ? "Hoch" : "Extrem";
    const riskClass = (r: number) => r < 0.1 ? "risk-low" : r < 0.25 ? "risk-medium" : r < 0.4 ? "risk-high" : "risk-extreme";

    /**
     * Berechnet wie viele Ticks/Tage noch uebrig sind bis ein Cargo expired.
     * - null  => Cargo laeuft nicht ab (lifetimeTicks <= 0)
     * - <= 0  => Cargo ist gerade abgelaufen
     */
    const ticksUntilExpiry = (c: SessionCargoDTO): number | null => {
        if (!c.expiresAtTick || c.expiresAtTick < 0) return null;
        return c.expiresAtTick - currentTick;
    };

    const expiryClass = (ticksLeft: number | null): string => {
        if (ticksLeft == null) return "";
        if (ticksLeft <= 2) return "cargo-expiry-critical";
        if (ticksLeft <= 5) return "cargo-expiry-warn";
        return "cargo-expiry-ok";
    };

    // Lokal abgelaufene Cargos rausfiltern (das Backend macht das auch beim naechsten Tick,
    // aber wir wollen nicht warten bis der naechste WebSocket-Push kommt).
    useEffect(() => {
        setCargos((prev) => {
            const filtered = prev.filter((c) => {
                const left = ticksUntilExpiry(c);
                return left == null || left > 0;
            });
            return filtered.length === prev.length ? prev : filtered;
        });
        // selected ggf. abwaehlen wenn er gerade abgelaufen ist
        if (selected) {
            const left = ticksUntilExpiry(selected);
            if (left != null && left <= 0) setSelected(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTick]);

    if (loading) {
        return <div className="cargo-screen"><p style={{ color: "#aaa", textAlign: "center", marginTop: 80 }}>Lade Frachtbörse…</p></div>;
    }

    const startBtnDisabled = !selected || !playerShipId || !currentPortId || shipInTransit || !canAfford || hasNoAffordableOption || starting;

    return (
        <div className="cargo-screen">
            <div className="cargo-container">
                <div className="cargo-header">
                    <h2 className="cargo-title">Frachtbörse</h2>
                </div>

                <div className="cargo-layout">
                    <div className="cargo-list">
                        <div className="cargo-list-header">Verfügbare Frachten ({cargos.length})</div>
                        {cargos.length === 0 && (
                            <div style={{ color: "#aaa", padding: 20, textAlign: "center", fontSize: 13 }}>
                                Momentan keine Fracht verfügbar.<br />
                                <span style={{ fontSize: 11, opacity: 0.6 }}>Neue Angebote erscheinen mit der Zeit.</span>
                            </div>
                        )}
                        {cargos.map((c) => {
                            const ticksLeft = ticksUntilExpiry(c);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelected(c); setFuelError(null); setStartError(null); }}
                                    className={`cargo-item ${selected?.id === c.id ? "active" : ""}`}
                                >
                                    <div className="cargo-item-row">
                                        <span className="cargo-item-name">{c.name}</span>
                                        <span className="cargo-item-profit">{Number(c.reward).toLocaleString("de-DE")} G</span>
                                    </div>
                                    <div className="cargo-item-sub">
                                    <span style={{ background: TYPE_COLORS[c.cargoType] + "22", color: TYPE_COLORS[c.cargoType], padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                                        {TYPE_LABELS[c.cargoType] ?? c.cargoType}
                                    </span>
                                        <span>{c.originPortName} → {c.destinationPortName}</span>
                                        {ticksLeft != null && (
                                            <span className={expiryClass(ticksLeft)} style={{ marginLeft: "auto", fontSize: 10, fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 22h14" />
                                                <path d="M5 2h14" />
                                                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                                                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                                            </svg>
                                                {ticksLeft} {ticksLeft === 1 ? "Tag" : "Tage"}
                                        </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="cargo-detail">
                        {selected ? (
                            <>
                                <div className="cargo-detail-title">{selected.name}</div>
                                <div style={{ color: "#7a6a4a", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                                    {selected.description}
                                </div>

                                <div className="cargo-route">
                                    <div className="cargo-port">
                                        <div className="cargo-port-name">{selected.originPortName}</div>
                                        <div style={{ fontSize: 10, color: "#999" }}>ABFAHRT</div>
                                    </div>
                                    <div className="cargo-route-line" />
                                    <div className="cargo-port">
                                        <div className="cargo-port-name">{selected.destinationPortName}</div>
                                        <div style={{ fontSize: 10, color: "#999" }}>ZIEL</div>
                                    </div>
                                </div>

                                <div className="cargo-stats">
                                    <div className="cargo-stat">
                                        <div className="cargo-stat-label">Belohnung</div>
                                        <strong>{Number(selected.reward).toLocaleString("de-DE")} G</strong>
                                    </div>
                                    <div className="cargo-stat">
                                        <div className="cargo-stat-label">Kapazität</div>
                                        <strong>{selected.capacity} t</strong>
                                    </div>
                                    <div className="cargo-stat">
                                        <div className="cargo-stat-label">Risiko</div>
                                        <strong className={riskClass(selected.risk)}>{riskLabel(selected.risk)}</strong>
                                    </div>
                                    <div className="cargo-stat">
                                        <div className="cargo-stat-label">Typ</div>
                                        <strong style={{ color: TYPE_COLORS[selected.cargoType] }}>
                                            {TYPE_LABELS[selected.cargoType]}
                                        </strong>
                                    </div>
                                </div>

                                {(() => {
                                    const ticksLeft = ticksUntilExpiry(selected);
                                    if (ticksLeft == null) return null;
                                    return (
                                        <div className={`cargo-expiry-box ${expiryClass(ticksLeft)}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="10" y1="2" x2="14" y2="2" />
                                                <line x1="12" y1="14" x2="15" y2="11" />
                                                <circle cx="12" cy="14" r="8" />
                                            </svg>
                                            <div>
                                                <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1 }}>VERFÜGBAR NOCH</div>
                                                <strong>{ticksLeft} {ticksLeft === 1 ? "Tag" : "Tage"}</strong>
                                            </div>
                                            {ticksLeft <= 2 && (
                                                <span style={{ marginLeft: "auto", fontSize: 11, fontStyle: "italic" }}>
                                                    läuft bald aus
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}

                                {!playerShipId && (
                                    <div className="cargo-speed-hint" style={{ marginTop: 20, marginBottom: 16 }}>
                                        Wähle zuerst ein Schiff aus, um eine Reise zu starten.
                                    </div>
                                )}

                                {playerShipId && (!currentPortId || shipInTransit) && (
                                    <div className="cargo-speed-hint" style={{ marginTop: 20, marginBottom: 16 }}>
                                        Dieses Schiff ist aktuell unterwegs. Treibstoff- und Dauerwerte sind erst wieder im Hafen verfügbar.
                                    </div>
                                )}

                                {playerShipId && currentPortId && !shipInTransit && (
                                    <div className="cargo-speed-section">
                                        <div className="cargo-speed-title">Reisegeschwindigkeit</div>

                                        {estimateLoading && !fuelEstimate && (
                                            <div className="cargo-speed-hint">Berechne Treibstoffverbrauch…</div>
                                        )}

                                        {fuelEstimate && (
                                            <>
                                                <div className="cargo-fuel-row">
                                                    <span>Tank</span>
                                                    <span className="cargo-fuel-value">
                                                        {fuelEstimate.currentFuelAbsolute.toFixed(0)} / {fuelEstimate.maxFuel.toFixed(0)}
                                                        {currentSpeedOpt && (
                                                            <span style={{
                                                                color: currentSpeedOpt.canAfford ? "#4a8a4a" : "#c04040",
                                                                marginLeft: 10,
                                                                fontWeight: "bold"
                                                            }}>
                                                                {currentSpeedOpt.canAfford ? "" : "⚠ "}
                                                                −{currentSpeedOpt.fuelRequiredAbsolute.toFixed(0)}
                                                                {" = "}
                                                                {(fuelEstimate.currentFuelAbsolute - currentSpeedOpt.fuelRequiredAbsolute).toFixed(0)}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="cargo-fuel-track">
                                                    <div
                                                        className="cargo-fuel-fill"
                                                        style={{ width: `${Math.min(100, (fuelEstimate.currentFuelAbsolute / fuelEstimate.maxFuel) * 100)}%` }}
                                                    />
                                                </div>

                                                <div className="cargo-speed-options">
                                                    {fuelEstimate.speedOptions.map((opt, idx) => {
                                                        const disabled = !opt.possible || !opt.canAfford;
                                                        const tooltip = !opt.possible
                                                            ? `Nicht machbar – Tank zu klein (${opt.fuelRequiredAbsolute.toFixed(0)} benötigt, Tank max ${fuelEstimate.maxFuel.toFixed(0)})`
                                                            : !opt.canAfford
                                                                ? `Nicht genug Treibstoff (${opt.fuelRequiredAbsolute.toFixed(0)} benötigt, verfügbar ${fuelEstimate.currentFuelAbsolute.toFixed(0)})`
                                                                : `Verbraucht ${opt.fuelRequiredAbsolute.toFixed(0)} Einheiten`;

                                                        const ticks = durationBySpeed[opt.speedSetting];
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`cargo-speed-btn${speedIndex === idx ? " active" : ""}${!opt.possible ? " impossible" : !opt.canAfford ? " unaffordable" : ""}`}
                                                                onClick={() => { if (!disabled) { setSpeedIndex(idx); setFuelError(null); } }}
                                                                disabled={disabled}
                                                                title={tooltip}
                                                            >
                                                                <span className="cargo-speed-label">{opt.label}</span>
                                                                <span className="cargo-speed-fuel">
                                                                    −{opt.fuelRequiredAbsolute.toFixed(0)}
                                                                </span>
                                                                {ticks != null && (
                                                                    <span className="cargo-speed-days">
                                                                        {ticks} {ticks === 1 ? "Tag" : "Tage"}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {hasNoAffordableOption && !fuelEstimate.speedOptions.every(o => !o.possible) && (
                                                    <div className="cargo-speed-warn">
                                                        Nicht genug Treibstoff. Tank muss aufgefüllt werden.
                                                    </div>
                                                )}
                                                {fuelEstimate.speedOptions.every(o => !o.possible) && (
                                                    <div className="cargo-speed-warn">
                                                        Strecke zu lang für dieses Schiff, selbst mit vollem Tank nicht machbar.
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {fuelError && <div className="cargo-error">{fuelError}</div>}
                                {startError && <div className="cargo-error">{startError}</div>}

                                <button
                                    type="button"
                                    className="cargo-btn"
                                    onClick={handleStartTravel}
                                    disabled={startBtnDisabled}
                                >
                                    {starting ? "Reise wird gestartet…" : "Reise starten"}
                                </button>
                            </>
                        ) : (
                            <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>
                                Wähle ein Frachtangebot aus.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
