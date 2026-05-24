import { useEffect, useRef } from "react";
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
    bottomOffset?: number;
    onDismiss: () => void;
}

function ShieldIcon({ tone }: { tone: "ok" | "bad" }) {
    const stroke = tone === "ok" ? "#3a6b2a" : "#8a3030";
    const fill = tone === "ok" ? "#3a6b2a" : "#8a3030";
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2L4 5.5V11C4 16.25 7.4 21.13 12 22.5C16.6 21.13 20 16.25 20 11V5.5L12 2Z"
                fill={fill} opacity="0.15" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
            />
            {tone === "ok" ? (
                <path d="M9 12.5L11 14.5L15.5 10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
                <path d="M9.5 9.5L14.5 14.5M14.5 9.5L9.5 14.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            )}
        </svg>
    );
}

function describeKind(kind: CustomsToastKind): { label: string; tone: "ok" | "bad" } {
    switch (kind) {
        case "CLEARED":       return { label: "Zoll bestanden",                  tone: "ok"  };
        case "HIDDEN":        return { label: "Zoll bestanden — nichts gefunden", tone: "ok"  };
        case "COOPERATED":    return { label: "Strafe bezahlt — festgesetzt",     tone: "bad" };
        case "BRIBE_SUCCESS": return { label: "Bestechung erfolgreich",           tone: "ok"  };
        case "BRIBE_FAILED":  return { label: "Bestechung fehlgeschlagen",        tone: "bad" };
    }
}

export default function CustomsResultToast({ kind, shipName, from, to, bottomOffset, onDismiss }: CustomsResultToastProps) {
    const ref = useRef<HTMLDivElement>(null);
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useEffect(() => {
        const el = ref.current;
        const timer = setTimeout(() => {
            if (el) el.classList.add("customs-toast-hide");
            setTimeout(() => onDismissRef.current(), 300);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    const { label, tone } = describeKind(kind);

    return (
        <div
            ref={ref}
            className={`customs-toast customs-toast-show customs-toast-${tone}`}
            style={{ bottom: `${bottomOffset ?? 60}px` }}
            onClick={() => {
                ref.current?.classList.add("customs-toast-hide");
                setTimeout(() => onDismissRef.current(), 300);
            }}
        >
            <ShieldIcon tone={tone} />
            <span className="customs-toast-ship">{shipName}</span>
            <span className="customs-toast-route">{from}→{to}</span>
            <span className="customs-toast-sep">—</span>
            <span className="customs-toast-label">{label}</span>
        </div>
    );
}