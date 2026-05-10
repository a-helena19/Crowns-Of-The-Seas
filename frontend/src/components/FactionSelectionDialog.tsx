import { useState, useEffect, useRef } from 'react';
import type { PlayerFaction } from '../types/faction';
import { FACTION_DATA, PLAYER_FACTION_VALUES } from '../types/faction';
import '../style/factionSelection.css';
import { sessionApi } from '../api/sessionApi';

interface FactionSelectionDialogProps {
    sessionId: string;
    userId: string;
    playerName: string;
    onFactionSelected: (faction: PlayerFaction) => void;
    onReadyClicked: () => void;
    isLoading: boolean;
    selectedFaction: PlayerFaction | null;
    isReady: boolean;
    readyStatus?: {
        readyPlayers: string[];
        totalPlayers: number;
        allReady: boolean;
    };
}

const SELECTION_TIME_SECONDS = 15;

export default function FactionSelectionDialog({
                                                   sessionId,
                                                   userId,
                                                   playerName,
                                                   onFactionSelected,
                                                   onReadyClicked,
                                                   isLoading,
                                                   selectedFaction,
                                                   isReady,
                                                   readyStatus,
                                               }: FactionSelectionDialogProps) {
    const factions: PlayerFaction[] = [...PLAYER_FACTION_VALUES];

    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(SELECTION_TIME_SECONDS);
    const [hasTimedOut, setHasTimedOut] = useState(false);

    const [currentlySelectedFaction, setCurrentlySelectedFaction] =
        useState<PlayerFaction | null>(selectedFaction);

    const submittedRef = useRef(false);
    const readySubmittedRef = useRef(false);

    const ensureFactionSubmitted = async (
        faction: PlayerFaction
    ): Promise<boolean> => {
        if (submittedRef.current) return true;
        submittedRef.current = true; // Lock SOFORT — vor await
        try {
            console.log(`Submitting faction: ${faction}`);
            await sessionApi.assignPlayerFaction(sessionId, userId, faction);
            onFactionSelected(faction);
            return true;
        } catch (err) {
            console.error('Error submitting faction:', err);
            submittedRef.current = false; // Lock zurücknehmen, damit Retry möglich
            setError('Fehler beim Auswählen der Fraktion. Bitte versuche es erneut.');
            return false;
        }
    };

    const submitReady = async (): Promise<boolean> => {
        if (readySubmittedRef.current) return true;
        readySubmittedRef.current = true;
        try {
            await sessionApi.markPlayerReady(sessionId, userId);
            onReadyClicked();
            return true;
        } catch (err: unknown) {
            console.error('Error marking ready:', err);
            readySubmittedRef.current = false;
            const message =
                err instanceof Error ? err.message : 'Fehler beim Ready-Status.';
            setError(message);
            return false;
        }
    };

    useEffect(() => {
        if (isReady || hasTimedOut) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setHasTimedOut(true);
                    // Auto-submit when time runs out
                    void (async () => {
                        // Wenn der User keine Faction gewählt hat → wähle Random JETZT
                        const factionToSubmit =
                            currentlySelectedFaction ??
                            factions[Math.floor(Math.random() * factions.length)];

                        setCurrentlySelectedFaction(factionToSubmit);
                        const ok = await ensureFactionSubmitted(factionToSubmit);
                        if (ok) await submitReady();
                    })();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isReady, hasTimedOut]);

    const handleFactionClick = (faction: PlayerFaction) => {
        if (isReady || hasTimedOut || submittedRef.current) return;
        setCurrentlySelectedFaction(faction);
        setError(null);
    };

    const handleReadyClicked = async () => {
        if (busy || isReady || hasTimedOut) return;
        if (!currentlySelectedFaction) {
            setError('Bitte wähle eine Fraktion!');
            return;
        }

        setBusy(true);
        setError(null);
        try {
            const factionOk = await ensureFactionSubmitted(currentlySelectedFaction);
            if (!factionOk) return;
            await submitReady();
        } finally {
            setBusy(false);
        }
    };

    const getProgressColor = () => {
        const percentage = (timeRemaining / SELECTION_TIME_SECONDS) * 100;
        if (percentage > 50) return '#4caf50';
        if (percentage > 25) return '#ff9800';
        return '#f44336';
    };

    const progressPercentage = (timeRemaining / SELECTION_TIME_SECONDS) * 100;
    const locked = isReady || hasTimedOut || submittedRef.current;

    return (
        <div className="faction-selection-overlay">
            <div className="faction-selection-dialog">
                <div className="faction-dialog-header">
                    <h2>Wähle deine Fraktion</h2>
                    <p className="player-name">Spieler: {playerName}</p>
                </div>

                <div className="timer-section">
                    <div className="timer-label">
                        Zeit verbleibend:{' '}
                        <span className="timer-value">{timeRemaining}s</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getProgressColor(),
                            }}
                        />
                    </div>
                    <p className="timer-info">
                        {hasTimedOut
                            ? '⏱️ Zeit abgelaufen! Fraktion wurde automatisch gespeichert.'
                            : '💡 Du kannst die Fraktion bis zur Bestätigung noch wechseln.'}
                    </p>
                </div>

                {error && (
                    <div className="faction-error-message">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                <div className="factions-grid">
                    {factions.map(faction => {
                        const data = FACTION_DATA[faction];
                        const isSelected = currentlySelectedFaction === faction;
                        const isSubmitted =
                            submittedRef.current && currentlySelectedFaction === faction;

                        return (
                            <div
                                key={faction}
                                className={`faction-card ${isSelected ? 'selected' : ''} ${
                                    isSubmitted ? 'submitted' : ''
                                } ${locked ? 'disabled' : ''}`}
                                onClick={() => handleFactionClick(faction)}
                                style={{
                                    borderColor: isSelected ? data.color : 'inherit',
                                    opacity: locked && !isSubmitted ? 0.4 : 1,
                                    cursor: locked ? 'not-allowed' : 'pointer',
                                }}
                                title={
                                    locked
                                        ? 'Fraktion kann nicht mehr geändert werden'
                                        : ''
                                }
                            >
                                <div className="faction-icon">{data.icon}</div>
                                <div className="faction-name">{data.name}</div>
                                <div className="faction-description">{data.description}</div>

                                {isSelected && !isSubmitted && (
                                    <div className="faction-checkmark">👁️</div>
                                )}

                                {isSubmitted && (
                                    <div className="faction-submitted-badge">✓ Gespeichert</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="faction-dialog-footer">
                    {readyStatus && (
                        <div className="ready-status-info">
                            <p>
                                Bereit: {readyStatus.readyPlayers.length}/
                                {readyStatus.totalPlayers}
                            </p>
                            {readyStatus.allReady && (
                                <p className="all-ready-message">
                                    ✓ Alle Spieler sind bereit! Spiel startet...
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        className={`ready-button ${isReady ? 'active' : ''} ${
                            !currentlySelectedFaction ? 'disabled' : ''
                        }`}
                        onClick={handleReadyClicked}
                        disabled={
                            !currentlySelectedFaction ||
                            isReady ||
                            isLoading ||
                            busy ||
                            hasTimedOut
                        }
                    >
                        {isReady
                            ? '✓ Bereit!'
                            : busy
                                ? 'Wird gespeichert...'
                                : hasTimedOut
                                    ? '⏱️ Automatisch gespeichert'
                                    : 'Bereit'}
                    </button>
                </div>
            </div>
        </div>
    );
}