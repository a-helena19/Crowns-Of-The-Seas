import { useEffect, useRef, useCallback } from "react";
import "../style/customsResultToast.css";


export type CustomsToastKind =
    | "CLEARED"
    | "HIDDEN"
    | "COOPERATED"
    | "BRIBE_SUCCESS"
    | "BRIBE_FAILED";

interface CustomsResultToastProps {
    kind: CustomsToastKind;
    shipName: string;
    from: string;
    to: string;
    onDismiss: () => void;
}

function describeKind(kind: CustomsToastKind): { icon: string; label: string; tone: "ok" | "bad" } {
    switch (kind) {
        case "CLEARED":
            return { icon: "🛃", label: "Zollkontrolle bestanden", tone: "ok" };
        case "HIDDEN":
            return { icon: "🛃", label: "Zoll hat nichts gefunden — Glück gehabt!", tone: "ok" };
        case "COOPERATED":
            return { icon: "🛃", label: "Strafe bezahlt — Schiff wird festgehalten", tone: "bad" };
        case "BRIBE_SUCCESS":
            return { icon: "🛃", label: "Bestechung angenommen!", tone: "ok" };
        case "BRIBE_FAILED":
            return { icon: "🛃", label: "Bestechung fehlgeschlagen — Strafe verdoppelt", tone: "bad" };
    }
}

export default function CustomsResultToast({ kind, shipName, from, to, onDismiss }: CustomsResultToastProps) {
    const toastRef = useRef<HTMLDivElement>(null);
    const dismissedRef = useRef(false);
    const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        toastRef.current?.classList.add("hide");
        setTimeout(onDismiss, 380);
    }, [onDismiss]);

    useEffect(() => {
        dismissedRef.current = false;
    }, []);

    useEffect(() => {
        autoTimerRef.current = setTimeout(dismiss, 4500);
        return () => {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        };
    }, [dismiss]);

    const { icon, label, tone } = describeKind(kind);

    return (
        <div ref={toastRef} className={`customs-toast show ${tone}`}>
            <div className="customs-toast-icon">{icon}</div>
            <div className="customs-toast-content">
                <div className="customs-toast-ship">{shipName}</div>
                <div className="customs-toast-route">{from} → {to}</div>
                <div className="customs-toast-label">{label}</div>
            </div>
            <button className="customs-toast-close" onClick={dismiss}>✕</button>
        </div>
    );
}