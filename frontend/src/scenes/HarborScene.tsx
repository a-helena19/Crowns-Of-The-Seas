import DepartureAnimation from "./DepartureAnimation";
import Sailor from "../components/Sailor";
import DialogBubble from "../components/DialogBubble";
import InfoPanel from "../components/InfoPanel";
import CargoScreen from "./CargoScreen";
import ShipScreen from "./ShipScreen";
import LoadingScreen from "./LoadingScreen";
import TravelResultScreen from "./TravelResultScreen";
import backIcon from "../assets/goback.png";
import background from "../assets/background.jpg";
import "../style/harbor.css";
import { useState, useEffect } from "react";

interface SelectedShip {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    status: string;
    maxCargoCapacity?: number;
    currentPortId?: string;
    iconUrl?: string;
}

interface ShipResponse {
    id: string;
    name: string;
    fuel: number;
    condition: number;
    status: string;
    maxCargoCapacity?: number;
    currentPortId?: string;
}

interface SelectedCargo {
    id: string;
    from: string;
    to: string;
    weight: number;
    destinationPortId: string;
    speedSetting: number;
}

interface CargoRewardBreakdown {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    percentage: number;
    status: "DELIVERED" | "EXPIRED";
    cargoType: string;
}

interface TravelCompleteEvent {
    travelId: string;
    playerId: string;
    cargoRewards: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
}

export default function HarborScene({ onClose }: { onClose: () => void }) {
    const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null);
    const [selectedCargo, setSelectedCargo] = useState<SelectedCargo | null>(null);
    const [isLoadingShip, setIsLoadingShip] = useState(false);
    const [loadingDone, setLoadingDone] = useState(false);
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [pilotageSelected, setPilotageSelected] = useState(false);
    const [showDeparture, setShowDeparture] = useState(false);
    const [travelResult, setTravelResult] = useState<TravelCompleteEvent | null>(null);

    const [view, setView] = useState<"main" | "cargo" | "ship">("main");
    const [currentPortId, setCurrentPortId] = useState<string | null>(null);
    const [infoHint, setInfoHint] = useState<string | null>(null);

    const userData = localStorage.getItem("crowns_user");
    const playerId: string | null = userData ? JSON.parse(userData).id : null;
    const sessionData = sessionStorage.getItem("currentSession");
    const sessionId: string | null = sessionData ? JSON.parse(sessionData).id : null;
    const token = localStorage.getItem("auth_token") ?? "";

    useEffect(() => {
        if (!playerId || !sessionId) return;
        fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json() as Promise<ShipResponse[]>)
            .then((ships) => {
                const atPort = ships.find((s) => s.status === "AT_PORT" && s.currentPortId);
                if (atPort?.currentPortId) {
                    setCurrentPortId(atPort.currentPortId);
                }
            })
            .catch(console.error);
    }, [playerId, sessionId, token]);

    useEffect(() => {
        const handleTravelComplete = (event: Event) => {
            const data = (event as CustomEvent<TravelCompleteEvent>).detail;
            setTravelResult(data);
        };

        window.addEventListener('travel-complete', handleTravelComplete);
        return () => window.removeEventListener('travel-complete', handleTravelComplete);
    }, []);

    function handleShipSelect(ship: any) {
        setSelectedShip(ship);
        setLoadingDone(false);
        setPilotageSelected(false);
        setView("main");
        const cargoWeight = selectedCargo?.weight ?? 0;
        const shipCap = ship.maxCargoCapacity ?? Infinity;
        if (selectedCargo && cargoWeight <= shipCap) {
            setIsLoadingShip(true);
        }
    }

    function handleBack() {
        if (view === "cargo" || view === "ship") setView("main");
        else onClose();
    }

    function handleOpenCargo() {
        setInfoHint(null);
        setView("cargo");
    }

    async function handleStartTravel() {
        if (!selectedCargo || !selectedShip || !playerId || !sessionId) return;
        setStarting(true);
        setStartError(null);
        try {
            const response = await fetch(`/api/travels/start/${playerId}?sessionId=${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    playerShipId: selectedShip.id,
                    destinationPortId: selectedCargo.destinationPortId,
                    sessionCargoId: selectedCargo.id,
                    speedSetting: selectedCargo.speedSetting,
                    pilotageService: pilotageSelected,
                }),
            });
            if (response.ok) {
                window.dispatchEvent(new CustomEvent('player-balance-updated'));
                setShowDeparture(true);
            } else {
                const text = await response.text();
                let msg = "Reise konnte nicht gestartet werden.";
                try {
                    const data = JSON.parse(text) as { error?: string; message?: string };
                    if (data.error === "CARGO_TAKEN") msg = "Fracht wurde bereits vergeben.";
                    else if (data.error === "CAPACITY_EXCEEDED") msg = "Schiff zu klein für diese Fracht.";
                    else if (data.error === "INSUFFICIENT_FUEL") msg = data.message ?? "Nicht genug Treibstoff.";
                    else if (data.error === "INSUFFICIENT_BALANCE") msg = data.message ?? "Nicht genug Taler für den Lotsendienst.";
                    else msg = data.message ?? msg;
                } catch { /* noop */ }
                setStartError(msg);
            }
        } catch {
            setStartError("Verbindungsfehler.");
        } finally {
            setStarting(false);
        }
    }

    const overCapacity = !!(selectedShip && selectedCargo &&
        selectedCargo.weight > (selectedShip.maxCargoCapacity ?? Infinity));


    return (
        <div className="scene">
            <img src={background} className="background" alt="" />

            <div className="back-icon-btn" onClick={handleBack}>
                <img src={backIcon} alt="Zurück" />
            </div>

            {view === "main" && (
                <>
                    <Sailor />
                    <DialogBubble
                        onOpenCargo={handleOpenCargo}
                        onOpenShip={() => setView("ship")}
                        onStartTravel={loadingDone && !overCapacity && pilotageSelected ? handleStartTravel : undefined}
                        startTravelDisabled={starting}
                        pilotageSelected={pilotageSelected}
                        onTogglePilotage={(isLoadingShip || loadingDone) ? () => setPilotageSelected(v => !v) : undefined}
                    />

                    <div className="right-side-panels">
                        {(selectedCargo || selectedShip) && (
                            <InfoPanel ship={selectedShip ?? undefined} />
                        )}
                        {(isLoadingShip || loadingDone) && selectedShip && selectedCargo && (
                            <LoadingScreen
                                ship={selectedShip}
                                cargo={selectedCargo}
                                done={loadingDone}
                                onComplete={() => { setIsLoadingShip(false); setLoadingDone(true); }}
                            />
                        )}
                    </div>

                    {overCapacity && selectedShip && selectedCargo && (
                        <div style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(180,30,30,0.93)",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            border: "2px solid #f44336",
                            whiteSpace: "nowrap",
                        }}>
                            Fracht ({selectedCargo.weight}t) übersteigt die Kapazität des Schiffs ({selectedShip.maxCargoCapacity}t)!
                        </div>
                    )}

                    {(infoHint || startError) && (
                        <div className="harbor-error-toast">{startError ?? infoHint}</div>
                    )}

                    {showDeparture && selectedShip && (
                        <DepartureAnimation
                            shipIconUrl={selectedShip.iconUrl ?? "/fallback-ship.png"}
                            onComplete={onClose}
                        />
                    )}

                    {travelResult && (
                        <TravelResultScreen
                            cargos={travelResult.cargoRewards}
                            baseReward={travelResult.baseReward}
                            totalReward={travelResult.totalReward}
                            previousBalance={travelResult.previousBalance}
                            newBalance={travelResult.newBalance}
                            onClose={() => {
                                setTravelResult(null);
                                onClose();
                            }}
                        />
                    )}
                </>
            )}

            {view === "cargo" && (
                <CargoScreen
                    currentPortId={currentPortId}
                    playerShipId={selectedShip?.id ?? null}
                    onCargoAccepted={(c) => {
                        setSelectedCargo(c);
                        setLoadingDone(false);
                        setPilotageSelected(false);
                        const shipCap = selectedShip?.maxCargoCapacity ?? Infinity;
                        if (selectedShip && c.weight <= shipCap) {
                            setIsLoadingShip(true);
                        } else {
                            setIsLoadingShip(false);
                        }
                        setView("main");
                    }}
                />
            )}

            {view === "ship" && (
                <ShipScreen onSelect={handleShipSelect} />
            )}
        </div>
    );
}
