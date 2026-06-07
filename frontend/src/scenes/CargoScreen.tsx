import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp, { Client } from "stompjs";
import "../style/cargo.css";
import { useTravelDuration } from "./TravelDurationInfo";
import CargoRouteMapView from "./CargoRouteMapView";
import EmptyVoyageScreen, { type VoyageStartedInfo } from "./EmptyVoyageScreen";
import Briefmarke from "../assets/Briefmarke.png";
import audioEngine from '../audio/AudioEngine';

interface SessionCargoDTO {
    id: string; name: string; description: string;
    originPortId: string; originPortName: string;
    destinationPortId: string; destinationPortName: string;
    reward: number; capacity: number; cargoType: string;
    risk: number; cargoStatus: string; containsIllegal: boolean;
    expiresAtTick: number; lifetimeTicks: number;
}
interface SpeedOption {
    speedSetting: number; label: string;
    fuelRequiredAbsolute: number; fuelRequiredPercent: number;
    canAfford: boolean; possible: boolean;
}
interface FuelEstimate {
    currentFuelPercent: number; currentFuelAbsolute: number;
    maxFuel: number; distance: number; speedOptions: SpeedOption[];
}
// interface CargoMarketEvent { availableCargos?: SessionCargoDTO[]; }
interface ShipPositionEventPayload {
    currentTick: number;
    ships: Array<{ playerShipId: string; status: "EN_ROUTE" | "AT_PORT" }>;
}
interface LoadingStartResponse {
    cargoId: string; loadingDurationSeconds: number; loadingCompletedAtTick: number;
}
const TYPE_LABELS: Record<string, string> = {
    GENERAL_GOODS: "Stückgut", FOOD: "Lebensmittel", INDUSTRIAL_GOODS: "Industriegüter",
    ELECTRONICS: "Elektronik", FRAGILE: "Zerbrechlich", HAZARDOUS: "Gefahrgut", LUXURY_GOODS: "Luxusgüter",
};
const TYPE_COLORS: Record<string, string> = {
    GENERAL_GOODS: "#7a9b6a", FOOD: "#c0874a", INDUSTRIAL_GOODS: "#6a7fa0",
    ELECTRONICS: "#6a5fb0", FRAGILE: "#b08060", HAZARDOUS: "#b04040", LUXURY_GOODS: "#a07030",
};
const SPEED_SETTINGS = [0.25, 0.4, 0.6, 0.8, 1.0];
interface AcceptedCargo {
    id: string; from: string; to: string; weight: number;
    originPortId: string;
    destinationPortId: string; speedSetting: number; loadingDurationSeconds?: number;
}
const getExpiredRewardPercent = (t: string) =>
    ({ FOOD:0, HAZARDOUS:0, FRAGILE:10, ELECTRONICS:15, LUXURY_GOODS:20, GENERAL_GOODS:40, INDUSTRIAL_GOODS:50 }[t] ?? 0);


interface Props {
    onCargoAccepted: (cargo: AcceptedCargo) => void;
    onEmptyVoyageStarted: (info: VoyageStartedInfo) => void;
    currentPortId: string | null;
    playerShipId: string | null;
}

export default function CargoScreen({ onCargoAccepted, onEmptyVoyageStarted, currentPortId, playerShipId }: Props) {
    const [cargos, setCargos] = useState<SessionCargoDTO[]>([]);
    const [selected, setSelected] = useState<SessionCargoDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"fracht" | "leer">("fracht");
    const stompRef = useRef<Client | null>(null);
    const [speedIndex, setSpeedIndex] = useState(2);
    const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [fuelError, setFuelError] = useState<string | null>(null);
    const [acceptError, setAcceptError] = useState<string | null>(null);
    const starting = false;
    const [shipInTransit, setShipInTransit] = useState(false);
    const [currentTick, setCurrentTick] = useState<number>(window.__latestTick?.currentTick ?? 0);
    const [routeDescription, setRouteDescription] = useState<string>("");

    function showFuelErr(msg: string) {
        audioEngine.playSfx('error');
        setFuelError(msg);
    }
    function showAcceptErr(msg: string) {
        audioEngine.playSfx('error');
        setAcceptError(msg);
    }

    useEffect(() => {
        if (!selected || !currentPortId) {
            setRouteDescription("");
            return;
        }
        const token = localStorage.getItem("auth_token") ?? "";
        let cancelled = false;

        fetch(`/api/routes/${selected.originPortId}/${selected.destinationPortId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() as Promise<{ description?: string }> : null)
            .then(data => {
                if (!cancelled) {
                    setRouteDescription(data?.description ?? `Seeroute von ${selected.originPortName} nach ${selected.destinationPortName}.`);
                }
            })
            .catch(() => {
                if (!cancelled) setRouteDescription(`Seeroute von ${selected.originPortName} nach ${selected.destinationPortName}.`);
            });

        return () => { cancelled = true; };
    }, [selected?.id, selected?.originPortId, selected?.destinationPortId, currentPortId]);

    useEffect(() => {
        const onTick = (e: Event) => setCurrentTick((e as CustomEvent<{currentTick:number}>).detail.currentTick);
        window.addEventListener("backend-tick", onTick);
        return () => window.removeEventListener("backend-tick", onTick);
    }, []);

    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? (JSON.parse(sessionData) as {id:string}).id : null;
    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? (JSON.parse(userData) as {id:string}).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerShipId) { setShipInTransit(false); return; }
        const read = (ships: Array<{playerShipId:string;status:string}>) => {
            const me = ships.find(s => s.playerShipId === playerShipId);
            setShipInTransit(me?.status === "EN_ROUTE" || me?.status === "LOADING");
        };
        if (window.__latestShips) read(window.__latestShips.map(s => ({playerShipId:s.playerShipId,status:s.status})));
        const h = (evt: Event) => read((evt as CustomEvent<ShipPositionEventPayload>).detail.ships);
        window.addEventListener("backend-ship-positions", h);
        return () => window.removeEventListener("backend-ship-positions", h);
    }, [playerShipId]);

    const filterByPort = useCallback((list: SessionCargoDTO[]) =>
        currentPortId ? list.filter(c => c.originPortId === currentPortId) : list, [currentPortId]);

    console.log ("Filtering cargos for port", currentPortId, "player: ", playerId );
    useEffect(() => {
        if (!sessionId || !currentPortId) { setLoading(false); return; }
        fetch(`/api/cargo/${sessionId}/available?portId=${currentPortId}&playerId=${playerId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<SessionCargoDTO[]>)
            .then(data => {
                const f = filterByPort(data);
                setCargos(f);
                if (f.length > 0) setSelected(prev => prev ?? f[0]);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [sessionId, currentPortId, token, filterByPort]);

    useEffect(() => {
        if (!sessionId) return;
        const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
        const client = Stomp.over(new SockJS(wsUrl));
        client.debug = () => {};
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        client.connect(headers, () => {
            stompRef.current = client;
            client.subscribe(`/topic/session/${sessionId}/cargo`, () => {
                // Markt hat sich geändert — Cargos neu laden (mit playerId-Modifier)
                if (!currentPortId) return;
                fetch(`/api/cargo/${sessionId}/available?portId=${currentPortId}&playerId=${playerId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then(r => r.json())
                    .then((data: SessionCargoDTO[]) => {
                        const f = filterByPort(data);
                        setCargos(f);
                        setSelected(prev => {
                            if (prev && f.some(c => c.id === prev.id)) return prev;
                            if (prev) showAcceptErr("Diese Fracht wurde gerade von einem anderen Kapitän übernommen.");
                            return f[0] ?? null;
                        });
                    })
                    .catch(console.error);
            });
        }, () => {});
        return () => { if (client.connected) client.disconnect(() => {}); };
    }, [sessionId, token, filterByPort]);

    useEffect(() => {
        if (!selected || !playerShipId || !playerId || !sessionId || !currentPortId || shipInTransit) { setFuelEstimate(null); return; }
        let cancelled = false;
        setEstimateLoading(true); setFuelError(null);
        fetch(`/api/travels/fuel-estimate?playerId=${playerId}&sessionId=${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ playerShipId, sessionCargoId: selected.id }),
        }).then(res => res.ok ? res.json() as Promise<FuelEstimate> : Promise.reject())
            .then(data => {
                if (cancelled) return;
                setFuelEstimate(data);
                const aff = data.speedOptions.filter(o => o.canAfford);
                if (aff.length > 0) {
                    const idx = SPEED_SETTINGS.indexOf(aff[aff.length-1].speedSetting);
                    setSpeedIndex(idx >= 0 ? idx : 2);
                } else setSpeedIndex(0);
            }).catch(() => { if (!cancelled) setFuelEstimate(null); })
            .finally(() => { if (!cancelled) setEstimateLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id, playerShipId, playerId, sessionId, token, currentPortId, shipInTransit]);

    const durationOptions = useTravelDuration({
        playerShipId: currentPortId && !shipInTransit ? playerShipId : null,
        sessionCargoId: selected?.id ?? null, playerId, sessionId, token,
    });
    const findDuration = (speed: number) =>
        durationOptions.find(o => Math.abs(o.speedSetting - speed) < 0.001)?.durationTicks ?? null;
    const currentSpeedOpt = fuelEstimate?.speedOptions[speedIndex] ?? null;
    const canAfford = !fuelEstimate || (currentSpeedOpt?.canAfford ?? false);
    const hasNoAffordableOption = fuelEstimate != null && fuelEstimate.speedOptions.every(o => !o.canAfford);

    async function handleAcceptCargo() {
        if (!selected) return;
        if (!playerShipId) { showAcceptErr("Bitte zuerst ein Schiff auswählen."); return; }
        if (hasNoAffordableOption) { showFuelErr("Nicht genug Treibstoff für diese Fracht."); return; }
        if (!canAfford) { showFuelErr("Nicht genug Treibstoff für dieses Speed-Setting."); return; }
        setFuelError(null);
        try {
            const res = await fetch(`/api/cargo/accept?playerId=${playerId}&sessionId=${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ playerShipId, sessionCargoId: selected.id, destinationPortId: selected.destinationPortId }),
            });
            if (!res.ok) { const e = await res.json(); showFuelErr(e.message || "Fehler"); return; }
            const lr = await res.json() as LoadingStartResponse;
            onCargoAccepted({ id: selected.id, from: selected.originPortName, to: selected.destinationPortName,
                weight: selected.capacity, originPortId: selected.originPortId,
                destinationPortId: selected.destinationPortId,
                speedSetting: SPEED_SETTINGS[speedIndex], loadingDurationSeconds: lr.loadingDurationSeconds });
        } catch { showFuelErr("Verbindungsfehler beim Akzeptieren der Fracht"); }
    }

    const riskLabel = (r: number) => r < 0.1 ? "Niedrig" : r < 0.25 ? "Mittel" : r < 0.4 ? "Hoch" : "Extrem";
    const riskClass = (r: number) => r < 0.1 ? "risk-low" : r < 0.25 ? "risk-medium" : r < 0.4 ? "risk-high" : "risk-extreme";
    const ticksUntilExpiry = (c: SessionCargoDTO) => (!c.expiresAtTick || c.expiresAtTick < 0) ? null : c.expiresAtTick - currentTick;
    const expiryClass = (tl: number | null) => tl == null ? "" : tl <= 2 ? "expiry-critical" : tl <= 5 ? "expiry-warn" : "expiry-ok";

    useEffect(() => {
        setCargos(prev => { const f = prev.filter(c => { const l=ticksUntilExpiry(c); return l==null||l>0; }); return f.length===prev.length?prev:f; });
        if (selected) { const l=ticksUntilExpiry(selected); if (l!=null&&l<=0) setSelected(null); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTick]);

    const startBtnDisabled = !selected || !playerShipId || !currentPortId || shipInTransit || !canAfford || hasNoAffordableOption || starting;
    const selectedDurationTicks = fuelEstimate ? findDuration(SPEED_SETTINGS[speedIndex]) : null;


    return (
        <div className="cs-screen">
            <div className="cs-header">
                <h1 className="cs-title">{tab === "leer" ? "Leerfahrt" : "Frachtbörse"}</h1>
                <button
                    type="button"
                    className="cs-switch-btn"
                    onClick={() => { audioEngine.playSfx("buttonClick"); setTab(tab === "leer" ? "fracht" : "leer"); }}
                >
                    {tab === "leer" ? "← Zur Frachtbörse" : "Zur Leerfahrt →"}
                </button>
            </div>

            {tab === "leer" && (
                <EmptyVoyageScreen
                    currentPortId={currentPortId}
                    playerShipId={playerShipId}
                    onVoyageStarted={onEmptyVoyageStarted}
                />
            )}

            {tab === "fracht" && loading && <p className="cs-loading">Lade Frachtbörse…</p>}

            {tab === "fracht" && !loading && (
                <div className="cs-body">

                    <div className="cs-list-panel">
                        <div className="cs-list-header">
                            <span>Verfügbare Frachten ({cargos.length})</span>
                            <img src={Briefmarke} alt="" className="cs-list-stamp" />
                        </div>

                        {cargos.length === 0 && (
                            <div className="cs-list-empty">
                                Momentan keine Fracht verfügbar.<br />
                                <span>Neue Angebote erscheinen mit der Zeit.</span>
                            </div>
                        )}

                        {cargos.map(c => {
                            const tl = ticksUntilExpiry(c);
                            return (
                                <div key={c.id}
                                     onClick={() => { setSelected(c); setFuelError(null); setAcceptError(null); }}
                                     className={`cs-list-item${selected?.id === c.id ? " cs-list-item--active" : ""}`}>
                                    <div className="cs-item-row1">
                                        <span className="cs-item-name">{c.name}</span>
                                        <span className="cs-item-reward">{Number(c.reward).toLocaleString("de-DE")} T</span>
                                    </div>
                                    <div className="cs-item-row2">
                                    <span className="cs-type-badge" style={{ background: TYPE_COLORS[c.cargoType]+"22", color: TYPE_COLORS[c.cargoType] }}>
                                        {TYPE_LABELS[c.cargoType] ?? c.cargoType}
                                    </span>
                                        <span className="cs-item-route">{c.originPortName} → {c.destinationPortName}</span>
                                        {tl != null && (
                                            <span className={`cs-item-expiry ${expiryClass(tl)}`}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
                                            </svg>
                                                {tl} {tl === 1 ? "Tag" : "Tage"}
                                        </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="cs-detail-panel">
                        {selected ? (
                            <>
                                <div className="cs-detail-header">
                                    <div>
                                        <h2 className="cs-detail-title">{selected.name}</h2>
                                        <p className="cs-detail-desc">
                                            {selected.description?.trim()
                                                || `${TYPE_LABELS[selected.cargoType]} – Standardfracht ohne besondere Anforderungen.`}
                                        </p>
                                    </div>
                                    <div className="cs-header-badges">
                                        {(selected.cargoType === "FOOD" || selected.cargoType === "HAZARDOUS") && (
                                            <div className="cs-perishable-badge">
                                                ⚠ {selected.cargoType === "FOOD"
                                                ? "Verderbliche Ware – schnelle Lieferung erforderlich!"
                                                : "Gefährliches Material – wird bei Ablauf entsorgt!"}
                                            </div>
                                        )}
                                        {selected.cargoStatus === "EXPIRED" && (
                                            <div className="cs-expired-badge">
                                                ⚠ Abgelaufen – nur noch {getExpiredRewardPercent(selected.cargoType)}% Belohnung.
                                            </div>
                                        )}
                                        {(() => {
                                            const tl = ticksUntilExpiry(selected);
                                            if (tl == null) return null;
                                            return (
                                                <div className={`cs-expiry-badge ${expiryClass(tl)}`}>
                                                    <div className="cs-expiry-label">VERFÜGBAR NOCH</div>
                                                    <div className="cs-expiry-row">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
                                                        </svg>
                                                        <strong>{tl} {tl === 1 ? "Tag" : "Tage"}</strong>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="cs-route-bar">
                                    <span className="cs-port-from">{selected.originPortName}</span>
                                    <span className="cs-port-to">{selected.destinationPortName}</span>
                                </div>

                                <div className="cs-stats-grid">
                                    <div className="cs-stat">
                                        <div className="cs-stat-label">Belohnung</div>
                                        <div className="cs-stat-value">
                                            {Number(selected.reward).toLocaleString("de-DE")} T
                                            {selected.cargoStatus === "EXPIRED" && (
                                                <span className="cs-stat-reduced"> ({getExpiredRewardPercent(selected.cargoType)}%)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cs-stat">
                                        <div className="cs-stat-label">Kapazität</div>
                                        <div className="cs-stat-value">{selected.capacity}t</div>
                                    </div>
                                    <div className="cs-stat">
                                        <div className="cs-stat-label">Risiko</div>
                                        <div className={`cs-stat-value ${riskClass(selected.risk)}`}>{riskLabel(selected.risk)}</div>
                                    </div>
                                    <div className="cs-stat">
                                        <div className="cs-stat-label">Typ</div>
                                        <div className="cs-stat-value" style={{ color: TYPE_COLORS[selected.cargoType] }}>
                                            {TYPE_LABELS[selected.cargoType]}
                                        </div>
                                    </div>
                                </div>


                                {!playerShipId && <div className="cs-hint">Wähle zuerst ein Schiff aus, um eine Fracht anzunehmen.</div>}
                                {playerShipId && (!currentPortId || shipInTransit) && (
                                    <div className="cs-hint">Dieses Schiff ist aktuell unterwegs. Werte sind erst wieder im Hafen verfügbar.</div>
                                )}
                                {playerShipId && currentPortId && !shipInTransit && (
                                    <div className="cs-speed-section">
                                        <div className="cs-speed-title">REISEGESCHWINDIGKEIT</div>
                                        {estimateLoading && !fuelEstimate && <div className="cs-hint">Berechne Treibstoffverbrauch…</div>}
                                        {fuelEstimate && (
                                            <>
                                                <div className="cs-fuel-row">
                                                    <span className="cs-fuel-label">Tank</span>
                                                    <div className="cs-fuel-track">
                                                        <div className="cs-fuel-fill" style={{ width: `${Math.min(100,(fuelEstimate.currentFuelAbsolute/fuelEstimate.maxFuel)*100)}%` }} />
                                                    </div>
                                                    <span className="cs-fuel-nums">
                                                    {fuelEstimate.currentFuelAbsolute.toFixed(0)} / {fuelEstimate.maxFuel.toFixed(0)}
                                                        {currentSpeedOpt && (
                                                            <span style={{ color: currentSpeedOpt.canAfford?"#4a8a4a":"#c04040", marginLeft:8, fontWeight:"bold" }}>
                                                            {currentSpeedOpt.canAfford?"":"⚠ "}
                                                                −{currentSpeedOpt.fuelRequiredAbsolute.toFixed(0)} = {(fuelEstimate.currentFuelAbsolute-currentSpeedOpt.fuelRequiredAbsolute).toFixed(0)}
                                                        </span>
                                                        )}
                                                </span>
                                                </div>
                                                <div className="cs-speed-buttons">
                                                    {fuelEstimate.speedOptions.map((opt, idx) => {
                                                        const dis = !opt.possible || !opt.canAfford;
                                                        const ticks = findDuration(opt.speedSetting);
                                                        return (
                                                            <button key={idx} type="button"
                                                                    className={`cs-speed-btn${speedIndex===idx?" cs-speed-btn--active":""}${!opt.possible?" cs-speed-btn--impossible":!opt.canAfford?" cs-speed-btn--unaffordable":""}`}
                                                                    onClick={() => { if (!dis) { setSpeedIndex(idx); setFuelError(null); } }}
                                                                    disabled={dis}>
                                                                <span className="cs-speed-name">{opt.label}</span>
                                                                <span className="cs-speed-fuel">−{opt.fuelRequiredAbsolute.toFixed(0)}</span>
                                                                {ticks != null && <span className="cs-speed-days">{ticks}d</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {hasNoAffordableOption && !fuelEstimate.speedOptions.every(o=>!o.possible) && <div className="cs-warn">Nicht genug Treibstoff. Tank muss aufgefüllt werden.</div>}
                                                {fuelEstimate.speedOptions.every(o=>!o.possible) && <div className="cs-warn">Strecke zu lang für dieses Schiff.</div>}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="cs-bottom">
                                    <div className="cs-bottom-left">
                                        <div className="cs-route-section-label">ROUTE</div>
                                        <p className="cs-route-desc">
                                            {routeDescription}
                                        </p>
                                        {selectedDurationTicks != null && (
                                            <div className="cs-duration">{selectedDurationTicks} Tage</div>
                                        )}
                                        <div className="cs-error-slot">
                                            {fuelError && <div className="cs-error">{fuelError}</div>}
                                            {acceptError && <div className="cs-error">{acceptError}</div>}
                                        </div>
                                        <button type="button" className="cs-accept-btn" onClick={handleAcceptCargo} disabled={startBtnDisabled}>
                                            Reise Starten
                                        </button>
                                    </div>
                                    <div className="cs-map-wrapper">
                                        <CargoRouteMapView
                                            fromPortName={selected.originPortName}
                                            toPortName={selected.destinationPortName}
                                            fromPortId={selected.originPortId}
                                            toPortId={selected.destinationPortId}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="cs-empty-detail">Wähle ein Frachtangebot aus.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
