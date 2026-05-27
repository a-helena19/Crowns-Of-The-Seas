import { useEffect, useRef, useCallback } from "react";
import "../style/rewardToast.css";

interface MinigameStatusToastProps {
    title: string;
    message: string;
    success: boolean;
    onDismiss: () => void;
}

export default function MinigameStatusToast({ title, message, success, onDismiss }: MinigameStatusToastProps) {
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
        autoTimerRef.current = setTimeout(dismiss, 3200);
        return () => {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        };
    }, [dismiss]);

    return (
        <div ref={toastRef} className="reward-toast show">
            <div className="reward-toast-icon">{success ? "✅" : "⚠️"}</div>
            <div className="reward-toast-content">
                <div className="reward-toast-ship">{title}</div>
                <div className="reward-toast-route">{message}</div>
                <div className={`reward-toast-status ${success ? "ok" : "bad"}`}>
                    {success ? "Bestanden" : "Nicht bestanden"}
                </div>
            </div>
            <button className="reward-toast-close" onClick={dismiss}>✕</button>
        </div>
    );
}
