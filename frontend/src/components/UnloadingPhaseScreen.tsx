import React, { useState, useEffect } from 'react';
import '../style/unloadingPhase.css';

interface UnloadingPhaseScreenProps {
    shipName: string;
    portName: string;
    unloadingCompletedAtTick: number;
    currentTick: number;
    totalReward: number;
    cargoCount: number;
    onComplete?: () => void;
}

export const UnloadingPhaseScreen: React.FC<UnloadingPhaseScreenProps> = ({
                                                                              shipName,
                                                                              portName,
                                                                              unloadingCompletedAtTick,
                                                                              currentTick,
                                                                              totalReward,
                                                                              cargoCount,
                                                                              onComplete,
                                                                          }) => {
    const ticksRemaining = Math.max(0, unloadingCompletedAtTick - currentTick);
    const totalTicks = unloadingCompletedAtTick - Math.max(0, currentTick - (unloadingCompletedAtTick - currentTick));
    const progress = totalTicks > 0 ? ((totalTicks - ticksRemaining) / totalTicks) * 100 : 0;
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);

    useEffect(() => {
        if (ticksRemaining === 0 && totalReward > 0) {
            setShowRewardAnimation(true);
            const timer = setTimeout(() => {
                onComplete?.();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [ticksRemaining, totalReward, onComplete]);

    return (
        <div className="unloading-phase-screen">
            {/* Header */}
            <div className="unloading-header">
                <h2>⚓ Schiff entlädt Cargo</h2>
                <p className="port-info">Hafen: <strong>{portName}</strong></p>
            </div>

            {/* Main Content */}
            <div className="unloading-content">
                {/* Schiff Animation */}
                <div className="ship-container">
                    <div className="ship-icon">🚢</div>
                    <div className="ship-name">{shipName}</div>
                </div>

                {/* Entlade-Info */}
                <div className="unloading-info">
                    <div className="cargo-count">
                        <span className="label">📦 Cargos:</span>
                        <span className="value">{cargoCount}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-section">
                    <div className="progress-label">
                        <span>Entlade-Fortschritt</span>
                        <span className="ticks-remaining">
              {ticksRemaining > 0 ? `${ticksRemaining} Ticks verbleibend` : 'Fertig!'}
            </span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        >
                            <span className="progress-percentage">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className={`status-text ${ticksRemaining === 0 ? 'complete' : 'loading'}`}>
                    {ticksRemaining > 0 ? (
                        <div className="loading-text">
                            <div className="spinner"></div>
                            <p>Entlädt Cargo...</p>
                        </div>
                    ) : (
                        <div className="complete-text">
                            <p>✅ Entladen abgeschlossen!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reward Animation */}
            {showRewardAnimation && (
                <div className="reward-animation">
                    <div className="reward-popup">
                        <div className="reward-icon">💰</div>
                        <div className="reward-text">
                            <p className="reward-label">Belohnung erhalten!</p>
                            <p className="reward-amount">+{totalReward.toLocaleString()} Gold</p>
                        </div>
                    </div>
                    {/* Floating Gold Animation */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="floating-gold" style={{
                            left: `${20 + i * 15}%`,
                            animationDelay: `${i * 0.1}s`
                        }}>
                            💰
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Info */}
            <div className="unloading-footer">
                <p className="info-text">
                    Das Schiff entlädt automatisch und wird danach wieder bereit für neue Reisen sein.
                </p>
            </div>
        </div>
    );
};