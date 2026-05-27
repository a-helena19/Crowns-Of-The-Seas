import { useState } from "react";
import customsOfficer from "../assets/customs_officer.png";
import "../style/CustomsDialog.css";

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

    const routeLabel = `${originPortName} → ${destinationPortName}`;

    return (
        <div className="customs-overlay">
            <div className="customs-dialog">
                <div className="customs-ship-badge">
                    <span className="customs-ship-name">{shipName}</span>
                    <span className="customs-ship-route">{routeLabel}</span>
                </div>

                <div className="customs-body">
                    <div className="customs-officer-col">
                        <img
                            src={customsOfficer}
                            alt="Zollbeamter"
                            className="customs-officer-img"
                        />
                        <p className="customs-officer-label">Zollbeamter</p>
                    </div>

                    <div className="customs-content-col">
                        <h2 className="customs-title">Zollkontrolle</h2>

                        {phase === "initial" && (
                            <>
                                <p className="customs-text">
                                    Der Zollbeamte hat Ihre Ladung durchsucht und
                                    illegale Ware gefunden!
                                </p>
                                {illegalCargoLabels.length > 0 && (
                                    <p className="customs-cargo-hint">
                                        Beanstandet: {illegalCargoLabels.join(", ")}
                                    </p>
                                )}

                                <div className="customs-buttons">
                                    <button
                                        className="customs-btn customs-btn-cooperate"
                                        onClick={handleCooperate}
                                        disabled={busy}
                                    >
                                        Kooperieren
                                        <span className="customs-btn-sub">
                                            -{fineAmount.toLocaleString("de-DE")} T
                                            + {detentionTicks} Ticks Festsetzung
                                        </span>
                                    </button>
                                    <button
                                        className="customs-btn customs-btn-bribe"
                                        onClick={handleBribe}
                                        disabled={busy}
                                    >
                                        Bestechen
                                        <span className="customs-btn-sub">
                                            -{bribeCost.toLocaleString("de-DE")} T — Risiko!
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}

                        {phase === "bribe_success" && (
                            <>
                                <p className="customs-text customs-text-success">
                                    Ihre Bestechung war erfolgreich!
                                </p>
                                <p className="customs-detail">
                                    Keine Strafe, keine Festsetzung — das Schiff darf entladen.
                                </p>
                                <div className="customs-buttons">
                                    <button className="customs-btn customs-btn-cooperate" onClick={onDismiss}>
                                        Weiter
                                    </button>
                                </div>
                            </>
                        )}

                        {phase === "bribe_failed" && (
                            <>
                                <p className="customs-text customs-text-failure">
                                    Bestechung fehlgeschlagen!
                                </p>
                                <p className="customs-detail">
                                    Die Strafe verdoppelt sich auf{" "}
                                    {(fineAmount * 2).toLocaleString("de-DE")} T —
                                    das Schiff wird für {detentionTicks} Ticks festgehalten.
                                </p>
                                <div className="customs-buttons">
                                    <button className="customs-btn customs-btn-cooperate" onClick={onDismiss}>
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