import "../style/travelResult.css";
import { useState, useEffect } from 'react';

interface CargoRewardBreakdown {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    bonusReward?: number;
    percentage: number;
    status: "DELIVERED" | "EXPIRED";
    cargoType: string;
}

export interface CustomsSummary {
    outcome: "CLEARED" | "HIDDEN" | "COOPERATED" | "BRIBE_SUCCESS" | "BRIBE_FAILED";
    finePaid: number;
    bribePaid: number;
    bribeAttempted: boolean;
    detained: boolean;
    detentionTicks: number;
    wasCarryingIllegalCargo: boolean;
}

interface TravelResultScreenProps {
    cargos: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
    customsSummary?: CustomsSummary;
    onClose: () => void;
}


const IconAnchor = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="19" />
        <path d="M5 12H3a9 9 0 0 0 18 0h-2" />
    </svg>
);

const IconStar = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
);

const IconCargo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
);

const IconSmuggle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="1" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
);

const IconWarning = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const IconShield = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);


function customsInfo(s: CustomsSummary): { good: boolean; title: string; detail: string } {
    switch (s.outcome) {
        case "CLEARED":     return { good: true,  title: "Zollkontrolle — ohne Befund",      detail: "Routinekontrolle, keine Beanstandung." };
        case "HIDDEN":      return { good: true,  title: "Zollkontrolle — unentdeckt",        detail: "Die Ladung blieb verborgen." };
        case "COOPERATED":  return { good: false, title: "Zollkontrolle — Strafe bezahlt",    detail: s.detained ? `Schiff für ${s.detentionTicks} Ticks festgehalten.` : "Strafe beglichen, Fahrt freigegeben." };
        case "BRIBE_SUCCESS": return { good: true, title: "Bestechung — angenommen",          detail: "Der Beamte sah weg. Keine Strafe." };
        case "BRIBE_FAILED":  return { good: false, title: "Bestechung — abgelehnt",          detail: s.detained ? `Strafe verdoppelt. Schiff für ${s.detentionTicks} Ticks festgehalten.` : "Strafe verdoppelt." };
    }
}


export default function TravelResultScreen({
                                               cargos,
                                               baseReward,
                                               previousBalance,
                                               newBalance,
                                               customsSummary,
                                               onClose,
                                           }: TravelResultScreenProps) {
    const balanceGain = newBalance - previousBalance;
    const [displayedBalance, setDisplayedBalance] = useState(previousBalance);
    const [displayedDelta, setDisplayedDelta] = useState(0);

    useEffect(() => {
        const steps = 60;
        const stepMs = 2000 / steps;
        const inc = balanceGain / steps;
        let i = 0;
        const t = setInterval(() => {
            i++;
            setDisplayedBalance(Math.floor(previousBalance + inc * i));
            setDisplayedDelta(Math.floor(inc * i));
            if (i >= steps) {
                clearInterval(t);
                setDisplayedBalance(newBalance);
                setDisplayedDelta(balanceGain);
            }
        }, stepMs);
        return () => clearInterval(t);
    }, [previousBalance, newBalance, balanceGain]);

    const regularCargos = cargos.filter(c => c.cargoType !== "SMUGGLE");
    const smuggleCargo  = cargos.find(c => c.cargoType === "SMUGGLE");
    const isPerfect     = regularCargos.length > 0 && regularCargos.every(c => c.status === "DELIVERED");

    const customsFine  = customsSummary?.finePaid  ?? 0;
    const customsBribe = customsSummary?.bribePaid ?? 0;
    const customsTotal = customsFine + customsBribe;

    // Summary numbers
    const cargoBase    = regularCargos.reduce((s, c) => s + (c.actualReward - (c.bonusReward ?? 0)), 0);
    const smuggleTotal = smuggleCargo?.actualReward ?? 0;

    const fmt = (n: number) => n.toLocaleString("de-DE");

    return (
        <div className="travel-result-overlay">
            <div className="tr-panel">

                <div className="tr-header">
                    {isPerfect
                        ? <IconStar className="tr-header-icon" />
                        : <IconAnchor className="tr-header-icon" />
                    }
                    <div className="tr-header-text">
                        <div className="tr-title">
                            {isPerfect ? "Perfekte Reise" : "Reise abgeschlossen"}
                        </div>
                        {isPerfect && (
                            <div className="tr-subtitle">Alle Frachten pünktlich abgeliefert</div>
                        )}
                    </div>
                </div>

                {customsSummary && customsSummary.outcome !== "CLEARED" && (() => {
                    const info = customsInfo(customsSummary);
                    return (
                        <div className={`tr-customs ${info.good ? "good" : "bad"}`}>
                            {info.good
                                ? <IconShield className="tr-customs-icon" />
                                : <IconWarning className="tr-customs-icon" />
                            }
                            <div className="tr-customs-body">
                                <div className="tr-customs-title">{info.title}</div>
                                <div>{info.detail}</div>
                            </div>
                            {customsTotal > 0 && (
                                <div className="tr-customs-costs">
                                    {customsBribe > 0 && <div>Bestechung: -{fmt(customsBribe)} T</div>}
                                    {customsFine  > 0 && <div>Strafe: -{fmt(customsFine)} T</div>}
                                    <div className="tr-customs-costs-total">-{fmt(customsTotal)} T</div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div className="tr-section-label">
                    Frachtbilanz ({regularCargos.length + (smuggleCargo ? 1 : 0)})
                </div>
                <div className="tr-cargo-list">
                    {regularCargos.map((c) => {
                        const isExpired = c.status === "EXPIRED";
                        return (
                            <div key={c.cargoId} className={`tr-cargo-row ${isExpired ? "expired" : "delivered"}`}>
                                <IconCargo className="tr-cargo-type-icon" />
                                <div className="tr-cargo-info">
                                    <div className="tr-cargo-name">{c.cargoName}</div>
                                    <div className="tr-cargo-dest">
                                        {c.destinationPort}{isExpired ? ` — ${c.percentage}% Wert` : ""}
                                    </div>
                                </div>
                                <div className={`tr-cargo-amount ${isExpired ? "neutral" : "positive"}`}>
                                    +{fmt(c.actualReward)} T
                                </div>
                            </div>
                        );
                    })}

                    {smuggleCargo && (() => {
                        const confiscated = smuggleCargo.actualReward === 0;
                        return (
                            <div className={`tr-cargo-row ${confiscated ? "confiscated" : "smuggle"}`}>
                                <IconSmuggle className="tr-cargo-type-icon" />
                                <div className="tr-cargo-info">
                                    <div className="tr-cargo-name">{smuggleCargo.cargoName}</div>
                                    <div className="tr-cargo-dest">
                                        Schmuggelware{confiscated ? " — Konfisziert" : ""}
                                    </div>
                                </div>
                                <div className={`tr-cargo-amount ${confiscated ? "neutral" : "positive"}`}>
                                    {confiscated ? "0 T" : `+${fmt(smuggleCargo.actualReward)} T`}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="tr-section-label" style={{ marginTop: 12 }}>Abrechnung</div>
                <div className="tr-summary">
                    {cargoBase > 0 && (
                        <div className="tr-summary-row">
                            <span className="tr-summary-label">Cargo</span>
                            <span className="tr-summary-value positive">+{fmt(cargoBase)} T</span>
                        </div>
                    )}
                    {baseReward > 0 && (
                        <div className="tr-summary-row bonus">
                            <span className="tr-summary-label">Reisebonus</span>
                            <span className="tr-summary-value positive">+{fmt(baseReward)} T</span>
                        </div>
                    )}
                    {smuggleTotal > 0 && (
                        <div className="tr-summary-row bonus">
                            <span className="tr-summary-label">Schmuggel</span>
                            <span className="tr-summary-value positive">+{fmt(smuggleTotal)} T</span>
                        </div>
                    )}
                    {customsBribe > 0 && (
                        <div className="tr-summary-row deduction">
                            <span className="tr-summary-label">Bestechung</span>
                            <span className="tr-summary-value negative">-{fmt(customsBribe)} T</span>
                        </div>
                    )}
                    {customsFine > 0 && (
                        <div className="tr-summary-row deduction">
                            <span className="tr-summary-label">Zollstrafe</span>
                            <span className="tr-summary-value negative">-{fmt(customsFine)} T</span>
                        </div>
                    )}
                    <div className="tr-summary-row total">
                        <span className="tr-summary-label">Netto</span>
                        <span className={`tr-summary-value ${balanceGain >= 0 ? "positive" : "negative"}`}>
                            {balanceGain >= 0 ? "+" : ""}{fmt(balanceGain)} T
                        </span>
                    </div>
                </div>

                <div className="tr-section-label" style={{ marginTop: 12 }}>Kontostand</div>
                <div className="tr-balance">
                    <div className="tr-balance-col">
                        <div className="tr-balance-label">Vorher</div>
                        <div className="tr-balance-amount">{fmt(previousBalance)} T</div>
                    </div>
                    <div className="tr-balance-col center">
                        <IconArrowRight className="tr-balance-arrow" />
                        <div className={`tr-balance-delta ${displayedDelta >= 0 ? "positive" : "negative"}`}>
                            {displayedDelta >= 0 ? "+" : ""}{fmt(displayedDelta)} T
                        </div>
                    </div>
                    <div className="tr-balance-col" style={{ alignItems: "flex-end" }}>
                        <div className="tr-balance-label">Nachher</div>
                        <div className={`tr-balance-amount ${newBalance >= previousBalance ? "new" : "negative-new"}`}>
                            {fmt(displayedBalance)} T
                        </div>
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

                <button className="tr-close-btn" onClick={onClose}>
                    Weiter zur nächsten Reise
                </button>

            </div>
        </div>
    );
}
