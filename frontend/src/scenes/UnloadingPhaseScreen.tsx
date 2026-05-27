import React, { useState, useEffect } from 'react';
import '../style/unloadingPhase.css';

interface CargoDetail {
    id: string;
    name: string;
    cargoType: string;
    status: 'ASSIGNED' | 'DELIVERED' | 'EXPIRED';
    reward: number;
    actualReward?: number;
    percentage?: number;
}

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

interface UnloadingPhaseScreenProps {
    shipName: string;
    portName: string;
    unloadingCompletedAtTick: number;
    currentTick: number;
    totalReward: number;
    cargoList?: CargoDetail[]; // NEU - detaillierte Frachtliste
    baseReward?: number;
    onComplete?: (rewards?: { totalReward: number; cargoBreakdown?: CargoRewardBreakdown[] }) => void;
}

export const UnloadingPhaseScreen: React.FC<UnloadingPhaseScreenProps> = ({
                                                                              shipName,
                                                                              portName,
                                                                              unloadingCompletedAtTick,
                                                                              currentTick,
                                                                              totalReward,
                                                                              cargoList = [],
                                                                              baseReward = 0,
                                                                              onComplete,
                                                                          }) => {
    const ticksRemaining = Math.max(0, unloadingCompletedAtTick - currentTick);
    const totalTicks = unloadingCompletedAtTick - Math.max(0, currentTick - (unloadingCompletedAtTick - currentTick));
    const progress = totalTicks > 0 ? ((totalTicks - ticksRemaining) / totalTicks) * 100 : 0;
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [unloadedCargos, setUnloadedCargos] = useState<Set<string>>(new Set());

    // Simuliere schrittweise Entladung - eine Fracht pro Tick
    useEffect(() => {
        if (cargoList.length > 0 && ticksRemaining > 0) {
            const cargoIndex = Math.floor((totalTicks - ticksRemaining) / Math.max(1, totalTicks / cargoList.length));
            const newUnloadedCargos = new Set(cargoList.slice(0, cargoIndex).map(c => c.id));
            setUnloadedCargos(newUnloadedCargos);
        }
    }, [ticksRemaining, cargoList, totalTicks]);

    useEffect(() => {
        if (ticksRemaining === 0 && totalReward > 0) {
            setShowRewardAnimation(true);
            const timer = setTimeout(() => {
                onComplete?.({
                    totalReward,
                    cargoBreakdown: cargoList.map(c => ({
                        cargoId: c.id,
                        cargoName: c.name,
                        destinationPort: portName,
                        baseReward: c.reward,
                        actualReward: c.actualReward ?? c.reward,
                        percentage: c.percentage ?? 100,
                        status: c.status === 'EXPIRED' ? 'EXPIRED' : 'DELIVERED',
                        cargoType: c.cargoType
                    }))
                });
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [ticksRemaining, totalReward, onComplete, cargoList, portName]);

    // Hilfsfunktion um Frachttyp-Icon zu bekommen
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

    const getStatusClass = (status: string, cargoId: string): string => {
        if (unloadedCargos.has(cargoId)) {
            return 'cargo-unloaded';
        }
        return status.toLowerCase();
    };

    return (
        <div className="unloading-phase-screen">
            {/* Header */}
            <div className="unloading-header">
                <h2>⚓ Schiff entlädt Fracht</h2>
                <p className="port-info">Hafen: <strong>{portName}</strong></p>
            </div>

            {/* Main Content */}
            <div className="unloading-content">
                {/* Schiff Animation */}
                <div className="ship-container">
                    <div className="ship-icon">🚢</div>
                    <div className="ship-name">{shipName}</div>
                </div>

                {/* Frachtliste */}
                {cargoList.length > 0 && (
                    <div className="cargo-unloading-list">
                        <h3>📦 Frachtbestand ({cargoList.length})</h3>
                        <div className="cargo-items">
                            {cargoList.map((cargo) => (
                                <div
                                    key={cargo.id}
                                    className={`cargo-item ${getStatusClass(cargo.status, cargo.id)}`}
                                >
                                    <div className="cargo-item-header">
                                        <span className="cargo-icon">{getCargoIcon(cargo.cargoType)}</span>
                                        <span className="cargo-name">{cargo.name}</span>
                                    </div>
                                    <div className="cargo-reward-info">
                                        <span className="cargo-status-badge">
                                            {unloadedCargos.has(cargo.id) ? '✅ Entladen' : '⏳ Lädt...'}
                                        </span>
                                        <span className="cargo-reward">+{cargo.actualReward ?? cargo.reward}G</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                            <p>Entlädt {cargoList.length} Frachtstücke...</p>
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
                            <div className="reward-breakdown">
                                {cargoList.length > 0 && cargoList.some(c => c.actualReward) && (
                                    <p className="reward-breakdown-item">
                                        Fracht: +{cargoList.reduce((sum, c) => sum + (c.actualReward ?? 0), 0).toLocaleString()}G
                                    </p>
                                )}
                                {baseReward > 0 && (
                                    <p className="reward-breakdown-item">
                                        Bonus: +{baseReward.toLocaleString()}G
                                    </p>
                                )}
                            </div>
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
