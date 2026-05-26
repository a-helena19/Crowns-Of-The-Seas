import "../style/travelResult.css";
import { useState, useEffect } from 'react';

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

interface TravelResultScreenProps {
    cargos: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
    onClose: () => void;
}

export default function TravelResultScreen({
                                               cargos,
                                               baseReward,
                                               totalReward,
                                               previousBalance,
                                               newBalance,
                                               onClose,
                                           }: TravelResultScreenProps) {
    const balanceGain = newBalance - previousBalance;
    const [displayedBalance, setDisplayedBalance] = useState(previousBalance);
    const [displayedReward, setDisplayedReward] = useState(0);

    // Animate Balance Counter
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;
        const increment = balanceGain / steps;

        let current = 0;
        const interval = setInterval(() => {
            current++;
            setDisplayedBalance(Math.floor(previousBalance + increment * current));
            setDisplayedReward(Math.floor(increment * current));

            if (current >= steps) {
                clearInterval(interval);
                setDisplayedBalance(newBalance);
                setDisplayedReward(balanceGain);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [previousBalance, newBalance, balanceGain]);

    // Sorting: DELIVERED first, then EXPIRED
    const sortedCargos = [...cargos].sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "DELIVERED" ? -1 : 1;
    });

    const deliveredCount = sortedCargos.filter(c => c.status === "DELIVERED").length;
    const expiredCount = sortedCargos.filter(c => c.status === "EXPIRED").length;
    const isPerfect = expiredCount === 0 && deliveredCount > 0;

    // Get cargo type icon
    const getCargoIcon = (cargoType: string): string => {
        switch (cargoType) {
            case 'FOOD': return '🍎';
            case 'HAZARDOUS': return '☢️';
            case 'FRAGILE': return '🔨';
            case 'ELECTRONICS': return '📱';
            case 'LUXURY_GOODS': return '💎';
            case 'GENERAL_GOODS': return '📦';
            case 'INDUSTRIAL_GOODS': return '⚙️';
            default: return '📦';
        }
    };

    return (
        <div className="travel-result-overlay">
            {isPerfect && <div className="confetti-container">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="confetti" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.3}s`
                    }}>
                        {['🎉', '✨', '🌟', '💰'][Math.floor(Math.random() * 4)]}
                    </div>
                ))}
            </div>}

            <div className="travel-result-panel">
                {/* Header */}
                <div className="result-header">
                    <h2>
                        {isPerfect ? '🌟 Perfekte Reise!' : '⚓ Reise abgeschlossen!'}
                    </h2>
                    {isPerfect && <p className="perfect-bonus">100% Lieferquote Bonus!</p>}
                </div>

                {/* Cargo Breakdown */}
                <div className="cargo-breakdown">
                    <h3>Frachtbilanz ({cargos.length} Einträge)</h3>

                    {deliveredCount > 0 && (
                        <div className="cargo-status-group">
                            <div className="status-group-header">
                                <span className="status-icon delivered">✅</span>
                                <span className="status-title">Erfolgreich abgeliefert ({deliveredCount})</span>
                            </div>
                            <div className="cargo-items delivered-items">
                                {sortedCargos.filter(c => c.status === "DELIVERED").map((cargo, idx) => (
                                    <div
                                        key={cargo.cargoId}
                                        className="cargo-result-item cargo-result-delivered"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="cargo-result-info">
                                            <span className="cargo-icon">{getCargoIcon(cargo.cargoType)}</span>
                                            <div className="cargo-details">
                                                <span className="cargo-result-name">{cargo.cargoName}</span>
                                                <span className="cargo-result-port">→ {cargo.destinationPort}</span>
                                            </div>
                                        </div>

                                        <div className="cargo-result-reward">
                                            <span className="reward-amount delivered-amount">+{cargo.actualReward.toLocaleString()}G</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {expiredCount > 0 && (
                        <div className="cargo-status-group">
                            <div className="status-group-header">
                                <span className="status-icon expired">⚠️</span>
                                <span className="status-title">Abgelaufen oder verzögert ({expiredCount})</span>
                            </div>
                            <div className="cargo-items expired-items">
                                {sortedCargos.filter(c => c.status === "EXPIRED").map((cargo, idx) => (
                                    <div
                                        key={cargo.cargoId}
                                        className="cargo-result-item cargo-result-expired"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="cargo-result-info">
                                            <span className="cargo-icon">{getCargoIcon(cargo.cargoType)}</span>
                                            <div className="cargo-details">
                                                <span className="cargo-result-name">{cargo.cargoName}</span>
                                                <span className="cargo-result-port">→ {cargo.destinationPort}</span>
                                            </div>
                                        </div>

                                        <div className="cargo-result-reward">
                                            <span className="reward-percentage">({cargo.percentage}%)</span>
                                            <span className="reward-amount expired-amount">+{cargo.actualReward.toLocaleString()}G</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="reward-summary">
                        {cargos.length > 0 && (
                            <div className="summary-item">
                                <span className="summary-label">Frachtbelohnung:</span>
                                <span className="summary-value">
                                    +{cargos.reduce((sum, c) => sum + c.actualReward, 0).toLocaleString()}G
                                </span>
                            </div>
                        )}

                        {baseReward > 0 && (
                            <div className="summary-item bonus">
                                <span className="summary-label">🎁 Reisebonus:</span>
                                <span className="summary-value">+{baseReward.toLocaleString()}G</span>
                            </div>
                        )}

                        <div className="summary-divider"></div>

                        <div className="summary-item total">
                            <span className="summary-label">Gesamtbelohnung:</span>
                            <span className="summary-value total-amount">
                                +{totalReward.toLocaleString()}G
                            </span>
                        </div>
                    </div>
                </div>

                {/* Balance Update */}
                <div className="balance-update">
                    <h3>Kontostand</h3>

                    <div className="balance-row">
                        <span className="balance-label">Vorher:</span>
                        <span className="balance-amount">{previousBalance.toLocaleString()}G</span>
                    </div>

                    <div className="balance-change">
                        <div className="change-arrow">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M7 10l5 5 5-5z" />
                            </svg>
                        </div>
                        <div className="change-amount">+{displayedReward.toLocaleString()}G</div>
                    </div>

                    <div className="balance-row new">
                        <span className="balance-label">Nachher:</span>
                        <span className="balance-amount new-amount">{displayedBalance.toLocaleString()}G</span>
                    </div>
                </div>

                {/* Action Button */}
                <button className="close-button" onClick={onClose}>
                    Weiter zur nächsten Reise →
                </button>
            </div>
        </div>
    );
}
