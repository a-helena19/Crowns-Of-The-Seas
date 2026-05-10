import { useState, useEffect } from 'react';
import type { PlayerFaction } from '../types/faction';
import { FACTION_DATA, PLAYER_FACTION_VALUES } from '../types/faction';
import '../style/factionSelection.css';
import {sessionApi} from "../api/sessionApi.ts";

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
                                                   readyStatus
                                               }: FactionSelectionDialogProps) {
    const [error, setError] = useState<string | null>(null);
    const [selectingFaction, setSelectingFaction] = useState(false);
    const [markingReady, setMarkingReady] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(SELECTION_TIME_SECONDS);
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [currentlySelectedFaction, setCurrentlySelectedFaction] = useState<PlayerFaction | null>(selectedFaction);
    // Track if faction has been successfully submitted to backend
    const [factionSubmitted, setFactionSubmitted] = useState(false);

    const factions: PlayerFaction[] = [...PLAYER_FACTION_VALUES];

    // Initialize with random default faction
    useEffect(() => {
        if (!currentlySelectedFaction) {
            const randomFaction = factions[Math.floor(Math.random() * factions.length)];
            setCurrentlySelectedFaction(randomFaction);
            console.log(`Default faction selected: ${randomFaction}`);
        }
    }, []);

    // Timer für 15 Sekunden
    useEffect(() => {
        if (isReady || hasTimedOut) return; // Stoppe Timer wenn ready oder timeout

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                const newTime = prev - 1;

                if (newTime <= 0) {
                    console.log('Time expired - auto-submitting faction and marking ready');
                    setHasTimedOut(true);
                    // Auto-submit faction and mark ready when time expires
                    (async () => {
                        const success = await submitFaction(currentlySelectedFaction);
                        if (success) {
                            try {
                                await sessionApi.markPlayerReady(sessionId, userId);
                                onReadyClicked();
                            } catch (err) {
                                console.error('Error auto-marking ready:', err);
                            }
                        }
                    })();
                    return 0;
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isReady, hasTimedOut, currentlySelectedFaction]);

    const submitFaction = async (faction: PlayerFaction | null): Promise<boolean> => {
        if (!faction) {
            setError('Bitte wähle eine Fraktion!');
            return false;
        }

        // Already submitted to backend - don't send again
        if (factionSubmitted) {
            return true;
        }

        setError(null);
        setSelectingFaction(true);

        try {
            console.log(`Submitting faction: ${faction}`);
            await sessionApi.assignPlayerFaction(sessionId, userId, faction);
            setFactionSubmitted(true);
            onFactionSelected(faction);
            return true;
        } catch (err) {
            console.error('Error selecting faction:', err);
            setError('Fehler beim Auswählen der Fraktion. Bitte versuche es erneut.');
            return false;
        } finally {
            setSelectingFaction(false);
        }
    };

    const handleFactionClick = (faction: PlayerFaction) => {
        if (isReady || hasTimedOut) return; // Nicht änderbar nach ready oder timeout

        // Nur UI-Update, noch nicht submittiert
        setCurrentlySelectedFaction(faction);
        console.log(`Faction preview changed to: ${faction}`);
    };

    const handleReadyClicked = async () => {
        if (!currentlySelectedFaction) {
            setError('Bitte wähle eine Fraktion!');
            return;
        }

        // Submit faction first if not yet sent to backend
        if (!factionSubmitted) {
            const success = await submitFaction(currentlySelectedFaction);
            if (!success) return; // Don't proceed if faction submit failed
        }

        setError(null);
        setMarkingReady(true);

        try {
            console.log('Marking player as ready');
            await sessionApi.markPlayerReady(sessionId, userId);

            onReadyClicked();
        } catch (err: any) {
            console.error('Error marking ready:', err);
            setError(err.message || 'Fehler beim Ready-Status. Bitte versuche es erneut.');
        } finally {
            setMarkingReady(false);
        }
    };

    // Progress bar color based on time
    const getProgressColor = () => {
        const percentage = (timeRemaining / SELECTION_TIME_SECONDS) * 100;
        if (percentage > 50) return '#4caf50'; // Green
        if (percentage > 25) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    const progressPercentage = (timeRemaining / SELECTION_TIME_SECONDS) * 100;

    return (
        <div className="faction-selection-overlay">
            <div className="faction-selection-dialog">
                <div className="faction-dialog-header">
                    <h2>Wähle deine Fraktion</h2>
                    <p className="player-name">Spieler: {playerName}</p>
                </div>

                {/* Timer Display */}
                <div className="timer-section">
                    <div className="timer-label">
                        Zeit verbleibend: <span className="timer-value">{timeRemaining}s</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getProgressColor()
                            }}
                        />
                    </div>
                    <p className="timer-info">
                        {hasTimedOut
                            ? '⏱️ Zeit abgelaufen! Fraktion wurde automatisch gespeichert.'
                            : '💡 Du kannst die Fraktion bis zur automatischen Abgabe noch wechseln.'}
                    </p>
                </div>

                {error && (
                    <div className="faction-error-message">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                <div className="factions-grid">
                    {factions.map((faction) => {
                        const data = FACTION_DATA[faction];
                        const isSelected = currentlySelectedFaction === faction;
                        const isSubmitted = selectedFaction === faction;

                        return (
                            <div
                                key={faction}
                                className={`faction-card ${isSelected ? 'selected' : ''} ${
                                    isSubmitted ? 'submitted' : ''
                                } ${isReady || hasTimedOut ? 'disabled' : ''}`}
                                onClick={() => handleFactionClick(faction)}
                                style={{
                                    borderColor: isSelected ? data.color : 'inherit',
                                    opacity: (isReady || hasTimedOut) && !isSubmitted ? 0.4 : 1
                                }}
                                title={
                                    isReady || hasTimedOut ? 'Fraktion kann nicht mehr geändert werden' :
                                        isSubmitted ? 'Fraktion gespeichert' : ''
                                }
                            >
                                <div className="faction-icon">{data.icon}</div>
                                <div className="faction-name">{data.name}</div>
                                <div className="faction-description">{data.description}</div>

                                {isSelected && (
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
                            <p>Bereit: {readyStatus.readyPlayers.length}/{readyStatus.totalPlayers}</p>
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
                        disabled={!currentlySelectedFaction || isReady || isLoading || selectingFaction || markingReady || hasTimedOut}
                    >
                        {isReady
                            ? '✓ Bereit!'
                            : markingReady
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