import { useState } from "react";
import customsOfficer from "../assets/customs_officer.png";
import "../style/customsDialog.css";

type Phase = "initial" | "bribe_success" | "bribe_failed";

interface CustomsInspectionDialogProps {
    inspectionId: string;
    travelId: string;
    shipName: string;
    originPortName: string;
    destinationPortName: string;
    fineAmount: number;
    bribeCost: number;
    detentionTicks: number;
    illegalCargoLabels: string[];
    onCooperate: () => Promise<void>;
    onBribe: () => Promise<"BRIBE_SUCCESS" | "BRIBE_FAILED" | "ERROR">;
    onDismiss: () => void;
}

export default function CustomsInspectionDialog({
                                                    shipName,
                                                    originPortName,
                                                    destinationPortName,
                                                    fineAmount,
                                                    bribeCost,
                                                    detentionTicks,
                                                    illegalCargoLabels,
                                                    onCooperate,
                                                    onBribe,
                                                    onDismiss,
                                                }: CustomsInspectionDialogProps) {
    const [phase, setPhase] = useState<Phase>("initial");
    const [busy, setBusy] = useState(false);

    async function handleCooperate() {
        if (busy) return;
        setBusy(true);
        try {
            await onCooperate();
            onDismiss();
        } finally {
            setBusy(false);
        }
    }

    async function handleBribe() {
        if (busy) return;
        setBusy(true);
        try {
            const outcome = await onBribe();
            if (outcome === "BRIBE_SUCCESS") {
                setPhase("bribe_success");
            } else if (outcome === "BRIBE_FAILED") {
                setPhase("bribe_failed");
            } else {
                onDismiss();
            }
        } finally {
            setBusy(false);
        }
    }

    function handleAcknowledge() {
        onDismiss();
    }

    const routeLabel = `${originPortName} → ${destinationPortName}`;

    return (
        <div className="customs-overlay">
            <div className="customs-container">
                <div className="customs-officer-info">
                    <img src={customsOfficer} alt="Zollbeamter" className="customs-officer-portrait" />
                    <p className="customs-officer-name">Zollbeamter</p>
                </div>

                <div className="customs-dialog">
                    <div className="customs-content">
                        <div className="customs-header">
                            <h2 className="customs-title">Zollkontrolle</h2>
                            <div className="customs-ship-badge">
                                <span className="customs-ship-name">{shipName}</span>
                                <span className="customs-ship-route">{routeLabel}</span>
                            </div>
                        </div>

                        {phase === "initial" && (
                            <>
                                <div className="customs-text">
                                    <p>Der Zollbeamte durchsucht Ihre Ladung nach illegaler Ware.</p>
                                    {illegalCargoLabels.length > 0 && (
                                        <p className="customs-cargo-hint">
                                            Beanstandet: {illegalCargoLabels.join(", ")}
                                        </p>
                                    )}
                                </div>

                                <div className="customs-buttons">
                                    <button
                                        className="customs-btn customs-btn-cooperate"
                                        onClick={handleCooperate}
                                        disabled={busy}
                                    >
                                        Kooperieren (-{fineAmount.toLocaleString("de-DE")} T)
                                    </button>
                                    <button
                                        className="customs-btn customs-btn-bribe"
                                        onClick={handleBribe}
                                        disabled={busy}
                                    >
                                        Bestechen (-{bribeCost.toLocaleString("de-DE")} T +Risiko!)
                                    </button>
                                </div>

                                <div className="customs-risk-hint">
                                    ! Bei Kooperation wird das Schiff für {detentionTicks} Ticks festgehalten
                                </div>
                            </>
                        )}

                        {phase === "bribe_success" && (
                            <>
                                <div className="customs-text customs-text-success">
                                    <p>Ihre Bestechung war erfolgreich! Glück gehabt.</p>
                                    <p className="customs-result-detail">
                                        Keine Strafe, keine Festsetzung — das Schiff darf entladen.
                                    </p>
                                </div>
                                <div className="customs-buttons">
                                    <button className="customs-btn customs-btn-cooperate" onClick={handleAcknowledge}>
                                        Weiter
                                    </button>
                                </div>
                            </>
                        )}

                        {phase === "bribe_failed" && (
                            <>
                                <div className="customs-text customs-text-failure">
                                    <p>Ihre Bestechung hat fehlgeschlagen!</p>
                                    <p className="customs-result-detail">
                                        Die Strafe verdoppelt sich auf {(fineAmount * 2).toLocaleString("de-DE")} T —
                                        das Schiff wird für {detentionTicks} Ticks festgehalten.
                                    </p>
                                </div>
                                <div className="customs-buttons">
                                    <button className="customs-btn customs-btn-cooperate" onClick={handleAcknowledge}>
                                        Verstanden
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}