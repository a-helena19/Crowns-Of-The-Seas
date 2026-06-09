import { useEffect, useRef, useCallback } from "react";
import "../style/rewardToast.css";

interface RewardToastProps {
    shipName: string;
    from: string;
    to: string;
    reward: number;
    onDismiss: () => void;
}

const formatTalers = (value: number | undefined | null) =>
    Number(value ?? 0).toLocaleString("de-DE", { maximumFractionDigits: 0 });

export default function RewardToast({ shipName, from, to, reward, onDismiss }: RewardToastProps) {
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
        autoTimerRef.current = setTimeout(dismiss, 3000);
        return () => {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        };
    }, [dismiss]);

    return (
        <div ref={toastRef} className="reward-toast show">
            <div className="reward-toast-icon">💰</div>
            <div className="reward-toast-content">
                <div className="reward-toast-ship">{shipName}</div>
                <div className="reward-toast-route">{from} → {to}</div>
	                <div className="reward-toast-amount">+{formatTalers(reward)} T</div>
            </div>
            <button className="reward-toast-close" onClick={dismiss}>✕</button>
        </div>
    );
}
