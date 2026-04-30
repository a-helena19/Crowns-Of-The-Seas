import { useEffect, useState } from "react";
import "../style/rewardToast.css";

interface RewardToastProps {
    shipName: string;
    from: string;
    to: string;
    reward: number;
    onDismiss: () => void;
}

export default function RewardToast({ shipName, from, to, reward, onDismiss }: RewardToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 400); // nach fade-out entfernen
        }, 6000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`reward-toast ${visible ? "show" : "hide"}`}>
            <div className="reward-toast-icon">💰</div>
            <div className="reward-toast-content">
                <div className="reward-toast-ship">{shipName}</div>
                <div className="reward-toast-route">{from} → {to}</div>
                <div className="reward-toast-amount">+{reward.toLocaleString("de-DE")} T</div>
            </div>
            <button className="reward-toast-close" onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}>✕</button>
        </div>
    );
}