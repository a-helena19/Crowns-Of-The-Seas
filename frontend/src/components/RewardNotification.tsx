import React, { useState, useEffect } from 'react';
import '../style/rewardNotification.css';

interface RewardNotificationProps {
    amount: number;
    isVisible: boolean;
    duration?: number; // in ms, default 2000
}

export const RewardNotification: React.FC<RewardNotificationProps> = ({
                                                                          amount,
                                                                          isVisible,
                                                                          duration = 2000,
                                                                      }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration]);

    if (!show) return null;

    return (
        <div className="reward-notification">
            <div className="reward-item">
                <span className="reward-icon">💰</span>
                <span className="reward-text">
          +{amount.toLocaleString()}
        </span>
            </div>
        </div>
    );
};