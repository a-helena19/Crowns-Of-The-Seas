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

const SELECTION_TIME_SECONDS = 30;

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

    const submittedFactionRef = useRef<PlayerFaction | null>(null);
    const readySubmittedRef = useRef(false);

    const ensureFactionSubmitted = async (faction: PlayerFaction): Promise<boolean> => {
        if (submittedFactionRef.current === faction) return true;
        try {
            await sessionApi.assignPlayerFaction(sessionId, userId, faction);
            submittedFactionRef.current = faction;
            onFactionSelected(faction);
            return true;
        } catch (err) {
            console.error('Error submitting faction:', err);
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
            const message = err instanceof Error ? err.message : 'Fehler beim Ready-Status.';
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
                    void (async () => {
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
        if (isReady || hasTimedOut) return;
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
            const ok = await ensureFactionSubmitted(currentlySelectedFaction);
            if (!ok) return;
            await submitReady();
        } finally {
            setBusy(false);
        }
    };

    const progressPercentage = (timeRemaining / SELECTION_TIME_SECONDS) * 100;
    const locked = isReady || hasTimedOut;
    const submittedFaction = submittedFactionRef.current;

    const getStatusBadge = (
        faction: PlayerFaction
    ): { text: string; type: 'selected' | 'locked' } | null => {
        if (submittedFaction === faction && locked) return { text: 'GEWÄHLT', type: 'locked' };
        if (currentlySelectedFaction === faction) return { text: 'AUSGEWÄHLT', type: 'selected' };
        return null;
    };

    return (
        <div className="fs-overlay">
            <div className="fs-screen">
                <header className="fs-header">
                    <h1 className="fs-title">FRAKTIONSWAHL</h1>
                    <p className="fs-subtitle">Wähle deine Fraktion · Spieler: {playerName}</p>
                    <div className="fs-divider">
                        <span className="fs-divider-diamond">◆</span>
                    </div>
                </header>

                <div className="fs-timer-row">
                    <div className="fs-timer-track">
                        <div
                            className="fs-timer-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="fs-timer-label">
                        {hasTimedOut ? 'ZEIT ABGELAUFEN' : `${timeRemaining}s VERBLEIBEND`}
                    </div>
                </div>

                {error && <div className="fs-error">⚠ {error}</div>}

                <div className="fs-grid">
                    {factions.map(faction => {
                        const data = FACTION_DATA[faction];
                        const isSelected = currentlySelectedFaction === faction;
                        const status = getStatusBadge(faction);

                        return (
                            <div
                                key={faction}
                                className={`fs-card ${isSelected ? 'is-selected' : ''} ${
                                    locked ? 'is-locked' : ''
                                }`}
                                onClick={() => handleFactionClick(faction)}
                                style={{
                                    ['--card-accent' as string]: data.color,
                                }}
                            >
                                <div className="fs-card-image-wrap">
                                    <img
                                        src={data.image}
                                        alt={data.name}
                                        className="fs-card-image"
                                    />
                                    <div className="fs-card-icon-circle">
                                        <span className="fs-card-icon">{data.icon}</span>
                                    </div>
                                </div>

                                <div className="fs-card-body">
                                    <div className="fs-card-header-row">
                                        <span className="fs-card-name">{data.name}</span>
                                        {status && (
                                            <span className={`fs-card-badge fs-card-badge--${status.type}`}>
                                                {status.text}
                                            </span>
                                        )}
                                    </div>
                                    <div className="fs-card-desc">
                                        <p className="fs-card-flavor">{data.description}</p>
                                        <ul className="fs-card-pros">
                                            {data.pros.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                        <ul className="fs-card-cons">
                                            {data.cons.map((c, i) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reservierter Slot für späteren Heimathafen-Bereich.
                    Wenn das implementiert wird: aria-hidden entfernen,
                    Inhalt rendern, .fs-future-slot bekommt Padding/Inhalt. */}
                <section className="fs-future-slot" aria-hidden="true">
                    {/* Heimathafen-Wahl folgt */}
                </section>

                <footer className="fs-footer">
                    <div className="fs-ready-info">
                        {readyStatus && (
                            <>
                                <span className="fs-ready-label">BEREIT</span>
                                <span className="fs-ready-count">
                                    {readyStatus.readyPlayers.length} / {readyStatus.totalPlayers}
                                </span>
                                {readyStatus.allReady && (
                                    <span className="fs-ready-allset">
                                        · Alle bereit, Spiel startet …
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        className={`fs-ready-btn ${isReady ? 'is-confirmed' : ''}`}
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
                            ? '✓ BEREIT'
                            : busy
                                ? 'WIRD GESPEICHERT …'
                                : hasTimedOut
                                    ? 'AUTOMATISCH GESPEICHERT'
                                    : 'BEREIT'}
                    </button>
                </footer>
            </div>
        </div>
    );
}