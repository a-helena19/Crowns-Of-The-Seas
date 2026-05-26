import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGameSessionWebSocket } from '../hooks/useGameSessionWebSocket';
import '../style/sessionWaiting.css';
import FactionSelectionDialog from '../components/FactionSelectionDialog';
import type { PlayerFaction } from '../types/faction';
import { sessionApi } from '../api/sessionApi';
import audioEngine from '../audio/AudioEngine';

interface PlayerInfo {
    userId: string;
    playerName: string;
    isHost: boolean;
    faction?: PlayerFaction | null;
    homePortId?: string | null;
    ready?: boolean;
}

interface SessionUpdateEvent {
    sessionId: string;
    gameCode: string;
    status: 'LOBBY' | 'FACTION_SELECTION' | 'RUNNING' | 'FINISHED';
    playerCount: number;
    maxPlayers: number;
    players: PlayerInfo[];
    type: string;
}

export default function SessionWaitingScreen() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const sessionId = useMemo(() => {
        const data = sessionStorage.getItem('currentSession');
        return data ? JSON.parse(data).id : null;
    }, []);

    const initialSession = useMemo(() => {
        const data = sessionStorage.getItem('currentSession');
        return data ? JSON.parse(data) : null;
    }, []);

    const [status, setStatus] = useState<SessionUpdateEvent['status']>(
        initialSession?.status ?? 'LOBBY'
    );
    const [gameCode] = useState<string>(initialSession?.gameCode ?? '');
    const [maxPlayers] = useState<number>(initialSession?.maxPlayers ?? 4);
    const [players, setPlayers] = useState<PlayerInfo[]>(
        initialSession?.playersList ?? []
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const showFactionDialog = status === 'FACTION_SELECTION';

    const [selectedFaction, setSelectedFaction] = useState<PlayerFaction | null>(null);
    const [selectedHomePortId, setSelectedHomePortId] = useState<string | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    const userRole: 'host' | 'guest' = useMemo(() => {
        if (!user) return 'guest';
        const me = players.find(p => p.userId === user.id);
        return me?.isHost ? 'host' : 'guest';
    }, [players, user]);

    const readyStatus = useMemo(() => {
        const ready = players.filter(p => p.ready).map(p => p.userId);
        return {
            readyPlayers: ready,
            totalPlayers: players.length,
            allReady: players.length > 0 && ready.length === players.length,
        };
    }, [players]);

    const handleSessionUpdate = useCallback(
        (event: SessionUpdateEvent) => {
            console.log('[SessionWaiting] Update:', event.type, '→', event.status);

            setStatus(event.status);
            setPlayers(event.players ?? []);

            const cached = sessionStorage.getItem('currentSession');
            if (cached) {
                const parsed = JSON.parse(cached);
                parsed.status = event.status;
                parsed.playersList = event.players;
                sessionStorage.setItem('currentSession', JSON.stringify(parsed));
            }

            if (user && event.players) {
                const me = event.players.find(p => p.userId === user.id);
                if (me && !me.ready) setIsPlayerReady(false);
                if (me && me.faction) setSelectedFaction(me.faction);
                if (me && me.homePortId) setSelectedHomePortId(me.homePortId);
            }

            if (event.playerCount === 0) {
                cleanupSessionStorage();
                navigate('/lobby');
                return;
            }

            if (event.status === 'FACTION_SELECTION') {
                const introSeenKey = `intro_seen_${event.sessionId}`;
                if (sessionStorage.getItem(introSeenKey) !== 'true') {
                    sessionStorage.setItem(introSeenKey, 'true');
                    navigate('/intro');
                }
                return;
            }

            // RUNNING: Spiel läuft → /game
            if (event.status === 'RUNNING') {
                navigate('/game');
                return;
            }

            if (event.status === 'FINISHED') {
                cleanupSessionStorage();
                navigate('/lobby');
                return;
            }
        },
        [navigate, user]
    );

    const { isConnected } = useGameSessionWebSocket({
        sessionId,
        onSessionUpdate: handleSessionUpdate,
    });

    useEffect(() => {
        if (!sessionId) return;
        sessionApi.getSession(sessionId)
            .then(s => {
                setStatus(s.status as SessionUpdateEvent['status']);
                setPlayers(
                    (s.players ?? []).map(p => ({
                        userId: p.userId,
                        playerName: p.playerName,
                        isHost: p.isHost,
                        faction: p.faction as PlayerFaction | null,
                        ready: false,
                    }))
                );
            })
            .catch(err => console.warn('Initial session fetch failed:', err));
    }, [sessionId]);

    useEffect(() => {
        if (!audioEngine.isMusicPlaying) {
            audioEngine.playMusic('lobby');
        }
    }, []);

    const handleFactionSelected = (faction: PlayerFaction) => {
        setSelectedFaction(faction);
    };

    const handleHomePortSelected = (portId: string) => {
        setSelectedHomePortId(portId);
        // Im globalen State speichern für HarborScene
        window.__homePortId = portId;
    };

    const handleReadyClicked = () => {
        setIsPlayerReady(true);
    };

    const handleStartGame = async () => {
        if (!sessionId) return;
        try {
            console.log('Calling backend to start game with sessionId:', sessionId);
            await sessionApi.startGame(sessionId, {});
        } catch (error) {
            console.error('Error starting game:', error);
            setErrorMessage('Fehler beim Starten des Spiels. Bitte versuchen Sie es später erneut.');
        }
    };

    const cleanupSessionStorage = () => {
        sessionStorage.removeItem('currentSession');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('playerName');
        if (sessionId) sessionStorage.removeItem(`intro_seen_${sessionId}`);
    };

    const handleBackToLobby = async () => {
        if (sessionId) {
            try {
                await sessionApi.leaveSession(sessionId);
            } catch (error) {
                console.error('Error leaving session:', error);
            }
        }
        cleanupSessionStorage();
        navigate('/lobby');
    };

    if (showFactionDialog && sessionId && user) {
        return (
            <div className="session-waiting-page">
                <FactionSelectionDialog
                    sessionId={sessionId}
                    userId={user.id}
                    playerName={user.username}
                    onFactionSelected={handleFactionSelected}
                    onHomePortSelected={handleHomePortSelected}
                    onReadyClicked={handleReadyClicked}
                    isLoading={false}
                    selectedFaction={selectedFaction}
                    selectedHomePortId={selectedHomePortId}
                    isReady={isPlayerReady}
                    readyStatus={readyStatus}
                />
            </div>
        );
    }

    return (
        <div className="session-waiting-page">
            <div className="session-waiting-panel">
                <h1>Crown of the Seas</h1>
                <p className="subtitle">Session Warteraum</p>

                {errorMessage && (
                    <div className="error-message">
                        <p>{errorMessage}</p>
                    </div>
                )}

                {sessionId ? (
                    <>
                        <div className="session-info">
                            <div className="info-box">
                                <label>Session Code</label>
                                <code className="code-display">{gameCode}</code>
                            </div>

                            <div className="info-box join-link-box">
                                <label>Join-Link:</label>
                                <div className="link-container">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/join/${gameCode}`}
                                        readOnly
                                        className="join-link-input"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/join/${gameCode}`
                                            );
                                            alert('Link kopiert!');
                                        }}
                                        className="copy-btn"
                                    >
                                        Kopieren
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="players-section">
                            <h3>Spieler ({players.length}/{maxPlayers})</h3>
                            <div className="players-list">
                                {players.length > 0 ? (
                                    players.map(player => (
                                        <div key={player.userId} className="player-item">
                                            <span className="player-name">{player.playerName}</span>
                                            {player.faction && (
                                                <span className="player-faction">{player.faction}</span>
                                            )}
                                            {player.isHost && <span className="host-badge">HOST</span>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-players">
                                        {userRole === 'host'
                                            ? 'Warte auf Spieler...'
                                            : 'Warte auf Host zum Starten...'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="websocket-status">
                            ● WebSocket: {isConnected ? 'Connected' : 'Connecting...'}
                        </div>

                        <div className="button-group">
                            {userRole === 'host' && status === 'LOBBY' && (
                                <button
                                    onClick={handleStartGame}
                                    className="auth-btn start-btn"
                                    disabled={!isConnected}
                                >
                                    Spiel Starten
                                </button>
                            )}

                            <button onClick={handleBackToLobby} className="auth-btn secondary-btn">
                                Zurück
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-session">
                        <p>Keine Session gefunden.</p>
                        <button onClick={handleBackToLobby} className="auth-btn">
                            Zurück zur Lobby
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}