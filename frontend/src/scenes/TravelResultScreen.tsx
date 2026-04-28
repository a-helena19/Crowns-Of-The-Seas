import "../style/travelResult.css";

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

    return (
        <div className="travel-result-overlay">
            <div className="travel-result-panel">
                <h2>⚓ Reise abgeschlossen!</h2>

                <div className="cargo-breakdown">
                    <h3>Frachtbilanz</h3>
                    <div className="divider"></div>

                    {cargos.map((cargo) => (
                        <div
                            key={cargo.cargoId}
                            className={`cargo-result-item cargo-result-${cargo.status.toLowerCase()}`}
                        >
                            <div className="cargo-result-info">
                                <span className="cargo-result-name">{cargo.cargoName}</span>
                                <span className="cargo-result-port">{cargo.destinationPort}</span>
                            </div>

                            <div className="cargo-result-reward">
                                <span className="reward-status">
                                    {cargo.status === "DELIVERED" ? "✅" : "⚠️"}
                                </span>
                                <span className="reward-amount">+{cargo.actualReward}G</span>
                                {cargo.percentage < 100 && (
                                    <span className="reward-percentage">
                                        ({cargo.percentage}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {baseReward > 0 && (
                        <>
                            <div className="divider"></div>
                            <div className="cargo-result-item cargo-result-bonus">
                                <span className="cargo-result-name">🎁 Travel Bonus</span>
                                <span className="reward-amount">+{baseReward}G</span>
                            </div>
                        </>
                    )}

                    <div className="divider"></div>

                    <div className="cargo-result-total">
                        <span>Gesamt:</span>
                        <span className="total-reward">+{totalReward}G</span>
                    </div>
                </div>

                <div className="balance-update">
                    <div className="balance-line">
                        <span>Vorher:</span>
                        <span>{previousBalance}G</span>
                    </div>
                    <div className="balance-arrow">↓</div>
                    <div className="balance-line balance-new">
                        <span>Nachher:</span>
                        <span className="balance-gain">{newBalance}G (+{balanceGain}G)</span>
                    </div>
                </div>

                <button className="close-button" onClick={onClose}>
                    Weiter →
                </button>
            </div>
        </div>
    );
}