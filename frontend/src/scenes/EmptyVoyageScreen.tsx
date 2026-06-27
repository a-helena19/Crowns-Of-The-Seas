import { useState, useEffect } from "react";
import "../style/emptyVoyage.css";
import { getHarborWideImage } from "../config/harborWideImages";
import audioEngine from "../audio/AudioEngine";

interface PortDTO {
    id: string;
    name: string;
    x: number;
    y: number;
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

interface DurationOption {
    speedSetting: number;
    label: string;
    durationTicks: number;
}

interface DurationEstimate {
    options: DurationOption[];
}

interface ShipPositionEventPayload {
    currentTick: number;
    ships: Array<{ playerShipId: string; status: string }>;
}

const SPEED_SETTINGS = [0.25, 0.4, 0.6, 0.8, 1.0];

export interface VoyageStartedInfo {
    destinationPortId: string;
    destinationPortName: string;
    speedSetting: number;
}

interface Props {
    currentPortId: string | null;
    playerShipId: string | null;
    onVoyageStarted: (info: VoyageStartedInfo) => void;
}

export default function EmptyVoyageScreen({ currentPortId, playerShipId, onVoyageStarted }: Props) {
    const [ports, setPorts] = useState<PortDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PortDTO | null>(null);
    const [speedIndex, setSpeedIndex] = useState(2);
    const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
    const [durationOptions, setDurationOptions] = useState<DurationOption[]>([]);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shipInTransit, setShipInTransit] = useState(false);

    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId = sessionData ? (JSON.parse(sessionData) as { id: string }).id : null;
    const userData = localStorage.getItem("crowns_user");
    const playerId = userData ? (JSON.parse(userData) as { id: string }).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    function showError(msg: string) {
        audioEngine.playSfx("error");
        setError(msg);
    }

    useEffect(() => {
        fetch(`/api/ports`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<PortDTO[]>)
            .then(data => {
                const others = data.filter(p => p.id !== currentPortId);
                setPorts(others);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token, currentPortId]);

    useEffect(() => {
        if (!playerShipId) { setShipInTransit(false); return; }
        const read = (ships: Array<{ playerShipId: string; status: string }>) => {
            const me = ships.find(s => s.playerShipId === playerShipId);
            setShipInTransit(me?.status === "EN_ROUTE" || me?.status === "LOADING");
        };
        if (window.__latestShips) read(window.__latestShips.map(s => ({ playerShipId: s.playerShipId, status: s.status })));
        const h = (evt: Event) => read((evt as CustomEvent<ShipPositionEventPayload>).detail.ships);
        window.addEventListener("backend-ship-positions", h);
        return () => window.removeEventListener("backend-ship-positions", h);
    }, [playerShipId]);

    useEffect(() => {
        if (!selected || !playerShipId || !playerId || !sessionId || !currentPortId || shipInTransit) {
            setFuelEstimate(null);
            setDurationOptions([]);
            return;
        }
        let cancelled = false;
        setEstimateLoading(true);
        setError(null);

        const body = JSON.stringify({ playerShipId, destinationPortId: selected.id });
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

        const fuelReq = fetch(`/api/travels/fuel-estimate-port?playerId=${playerId}&sessionId=${sessionId}`, {
            method: "POST", headers, body,
        }).then(res => res.ok ? res.json() as Promise<FuelEstimate> : Promise.reject());

        const durationReq = fetch(`/api/travels/duration-estimate-port?playerId=${playerId}&sessionId=${sessionId}`, {
            method: "POST", headers, body,
        }).then(res => res.ok ? res.json() as Promise<DurationEstimate> : Promise.reject());

        Promise.all([fuelReq, durationReq])
            .then(([fuel, duration]) => {
                if (cancelled) return;
                setFuelEstimate(fuel);
                setDurationOptions(duration.options ?? []);
                const aff = fuel.speedOptions.filter(o => o.canAfford);
                if (aff.length > 0) {
                    const idx = SPEED_SETTINGS.indexOf(aff[aff.length - 1].speedSetting);
                    setSpeedIndex(idx >= 0 ? idx : 2);
                } else {
                    setSpeedIndex(0);
                }
            })
            .catch(() => { if (!cancelled) { setFuelEstimate(null); setDurationOptions([]); } })
            .finally(() => { if (!cancelled) setEstimateLoading(false); });

        return () => { cancelled = true; };
    }, [selected?.id, playerShipId, playerId, sessionId, token, currentPortId, shipInTransit]);

    const findDuration = (speed: number) =>
        durationOptions.find(o => Math.abs(o.speedSetting - speed) < 0.001)?.durationTicks ?? null;
    const currentSpeedOpt = fuelEstimate?.speedOptions[speedIndex] ?? null;
    const canAfford = !fuelEstimate || (currentSpeedOpt?.canAfford ?? false);
    const hasNoAffordableOption = fuelEstimate != null && fuelEstimate.speedOptions.every(o => !o.canAfford);
    const selectedDurationTicks = fuelEstimate ? findDuration(SPEED_SETTINGS[speedIndex]) : null;

    function handleStart() {
        audioEngine.playSfx("buttonClick");
        if (!selected) { showError("Bitte zuerst einen Zielhafen auswählen."); return; }
        if (!playerShipId) { showError("Bitte zuerst ein Schiff auswählen."); return; }
        if (hasNoAffordableOption) { showError("Nicht genug Treibstoff für diese Strecke."); return; }
        if (!canAfford) { showError("Nicht genug Treibstoff für dieses Tempo."); return; }
        setError(null);
        onVoyageStarted({
            destinationPortId: selected.id,
            destinationPortName: selected.name,
            speedSetting: SPEED_SETTINGS[speedIndex],
        });
    }

    if (loading) return <div className="ev-panel"><p className="ev-loading">Lade Häfen…</p></div>;

    const startDisabled = !selected || !playerShipId || !currentPortId || shipInTransit
        || !canAfford || hasNoAffordableOption;

    return (
        <div className="ev-panel">
            <h2 className="ev-section-title">Ports</h2>

            {!playerShipId && (
                <div className="ev-hint">Wähle zuerst ein Schiff aus, um eine Leerfahrt zu starten.</div>
            )}
            {playerShipId && (!currentPortId || shipInTransit) && (
                <div className="ev-hint">Dieses Schiff ist aktuell unterwegs. Eine Leerfahrt ist nur im Hafen möglich.</div>
            )}

            <div className="ev-ports-grid">
                {ports.map(p => {
                    const img = getHarborWideImage(p.name);
                    const active = selected?.id === p.id;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            className={`ev-port-card${active ? " ev-port-card--active" : ""}`}
                            onClick={() => { audioEngine.playSfx("buttonClick"); setSelected(p); setError(null); }}
                            disabled={!playerShipId || !currentPortId || shipInTransit}
                            data-tutorial={ports[0]?.id === p.id ? "empty-voyage-port" : undefined}
                        >
                            <div className="ev-port-img-wrap">
                                {img
                                    ? <img src={img} alt={p.name} className="ev-port-img" />
                                    : <div className="ev-port-img ev-port-img--missing" />}
                            </div>
                            <div className="ev-port-name">{p.name.toUpperCase()}</div>
                        </button>
                    );
                })}
            </div>

            {selected && playerShipId && currentPortId && !shipInTransit && (
                <div className="ev-speed-section" data-tutorial="empty-voyage-speed">
                    <div className="ev-speed-title">Reisegeschwindigkeit</div>

                    {estimateLoading && !fuelEstimate && <div className="ev-hint">Berechne Treibstoffverbrauch…</div>}

                    {fuelEstimate && (
                        <>
                            <div className="ev-fuel-row">
                                <span className="ev-fuel-label">Tank</span>
                                <div className="ev-fuel-track">
                                    <div
                                        className="ev-fuel-fill"
                                        style={{ width: `${Math.min(100, (fuelEstimate.currentFuelAbsolute / fuelEstimate.maxFuel) * 100)}%` }}
                                    />
                                </div>
                                <span className="ev-fuel-nums">
                                    {fuelEstimate.currentFuelAbsolute.toFixed(0)} / {fuelEstimate.maxFuel.toFixed(0)}
                                    {currentSpeedOpt && (
                                        <span style={{ color: currentSpeedOpt.canAfford ? "#4a8a4a" : "#c04040", marginLeft: 8, fontWeight: "bold" }}>
                                            {currentSpeedOpt.canAfford ? "" : "⚠ "}
                                            −{currentSpeedOpt.fuelRequiredAbsolute.toFixed(0)} = {(fuelEstimate.currentFuelAbsolute - currentSpeedOpt.fuelRequiredAbsolute).toFixed(0)}
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="ev-speed-buttons">
                                {fuelEstimate.speedOptions.map((opt, idx) => {
                                    const dis = !opt.possible || !opt.canAfford;
                                    const ticks = findDuration(opt.speedSetting);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`ev-speed-btn${speedIndex === idx ? " ev-speed-btn--active" : ""}${!opt.possible ? " ev-speed-btn--impossible" : !opt.canAfford ? " ev-speed-btn--unaffordable" : ""}`}
                                            onClick={() => { if (!dis) { audioEngine.playSfx("buttonClick"); setSpeedIndex(idx); setError(null); } }}
                                            disabled={dis}
                                        >
                                            <span className="ev-speed-name">{opt.label}</span>
                                            <span className="ev-speed-fuel">−{opt.fuelRequiredAbsolute.toFixed(0)}</span>
                                            {ticks != null && <span className="ev-speed-days">{ticks}d</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {hasNoAffordableOption && !fuelEstimate.speedOptions.every(o => !o.possible) && (
                                <div className="ev-warn">Nicht genug Treibstoff. Tank muss aufgefüllt werden.</div>
                            )}
                            {fuelEstimate.speedOptions.every(o => !o.possible) && (
                                <div className="ev-warn">Strecke zu lang für dieses Schiff.</div>
                            )}
                        </>
                    )}
                </div>
            )}

            {selectedDurationTicks != null && (
                <div className="ev-duration">{selectedDurationTicks} Tage</div>
            )}

            {error && <div className="ev-error">{error}</div>}

            <button type="button" className="ev-start-btn" onClick={handleStart} disabled={startDisabled} data-tutorial="prepare-empty-voyage">
                Leerfahrt vorbereiten
            </button>
        </div>
    );
}
