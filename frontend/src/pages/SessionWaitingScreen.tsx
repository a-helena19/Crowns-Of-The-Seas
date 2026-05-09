import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGameSessionWebSocket } from '../hooks/useGameSessionWebSocket';
import '../style/sessionWaiting.css';
import FactionSelectionDialog from '../components/FactionSelectionDialog';
import { useSessionContext } from '../context/useSessionContext';
import type { PlayerFaction } from '../types/faction';
import { sessionApi } from '../api/sessionApi';

interface GameSession {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
    playersList?: Array<{
        userId: string;
        playerName: string;
        isHost: boolean;
        faction?: PlayerFaction | null;
    }>;
}

interface SessionUpdateEvent {
    sessionId: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    playerCount: number;
    maxPlayers: number;
    players: Array<{
        userId: string;
        playerName: string;
        isHost: boolean;
        faction?: PlayerFaction | null;
    }>;
    type: string;
}

export default function SessionWaitingScreen() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [session, setSession] = useState<GameSession | null>(null);
    const [userRole, setUserRole] = useState<'host' | 'guest'>('guest');
    const [playerList, setPlayerList] = useState<Array<{ playerName: string; isHost: boolean; faction?: PlayerFaction | null; }>>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [showFactionDialog, setShowFactionDialog] = useState(false);
    const [selectedFaction, setSelectedFaction] = useState<PlayerFaction | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [readyStatus, setReadyStatus] = useState<{
        readyPlayers: string[];
        totalPlayers: number;
        allReady: boolean;
    } | null>(null);
    const { getReadyStatus } = useSessionContext();

    useEffect(() => {
        // Load session from sessionStorage
        const sessionData = sessionStorage.getItem('currentSession');
        const role = sessionStorage.getItem('userRole') as 'host' | 'guest';

        if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            setSession(parsedSession);

            // Set player list from session if available
            if (parsedSession.playersList && parsedSession.playersList.length > 0) {
                setPlayerList(parsedSession.playersList.map((p: { userId: string; playerName: string; isHost: boolean; faction?: PlayerFaction | null; }) => ({
                    playerName: p.playerName,
                    isHost: p.isHost,
                    faction: p.faction || null
                })));
            }
        }

        if (role) {
            setUserRole(role);
        }

        console.log('SessionWaitingScreen mounted:', { sessionData, role });
    }, []);

    // WebSocket for real-time updates
    const { isConnected } = useGameSessionWebSocket({
        sessionId: session?.id || null,
        onSessionUpdate: (event: SessionUpdateEvent) => {
            console.log('Session update received:', event);

            if (event.type === 'GAME_TRANSITION_STARTED') {
                console.log('Game transition started - showing faction dialog');
                setShowFactionDialog(true);
                return;
            }

            if (event.type === 'GAME_STARTED') {
                console.log('Game started - navigating to intro');
                setTimeout(() => {
                    navigate('/intro');
                }, 500);
                return;
            }

            // Update player list
            if (event.players) {
                setPlayerList(event.players.map((p: any) => ({
                    playerName: p.playerName,
                    isHost: p.isHost,
                    faction: p.faction || null
                })));

                // Check if current user is now the host
                const currentPlayerName = sessionStorage.getItem('playerName');
                const isNowHost = event.players.some((p: any) =>
                    p.playerName === currentPlayerName && p.isHost
                );
                if (isNowHost) {
                    console.log('User is now the host!');
                    setUserRole('host');
                }
            }

            if (event.playerCount === 0) {
                console.log('Session is now empty, navigating back to lobby');
                sessionStorage.removeItem('currentSession');
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('playerName');
                navigate('/lobby');
            }

            // Update session with new data
            if (session) {
                const updatedSession: GameSession = {
                    ...session,
                    status: event.status,
                    players: event.playerCount,
                    maxPlayers: event.maxPlayers,
                    playersList: event.players
                };
                setSession(updatedSession);
                sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));
            }
        }
    });

    useEffect(() => {
        if (!showFactionDialog || !session) return;

        const pollInterval = setInterval(async () => {
            try {
                const status = await getReadyStatus(session.id);
                setReadyStatus(status);

                // Wenn alle ready, wird automatisch GAME_STARTED Event gesendet
                // Aber als fallback auch hier checken
                if (status.allReady) {
                    console.log('All players ready!');
                    // Backend sollte automatisch starten, aber wir zeigen auch visuelles Feedback
                }
            } catch (error) {
                console.error('Error polling ready status:', error);
            }
        }, 2000); // Alle 2 Sekunden

        return () => clearInterval(pollInterval);
    }, [showFactionDialog, session, getReadyStatus]);

    const handleFactionSelected = (faction: PlayerFaction) => {
        console.log('Faction selected:', faction);
        setSelectedFaction(faction);
    };

    const handleReadyClicked = () => {
        console.log('Player clicked ready');
        setIsPlayerReady(true);
    };

    const handleStartGame = async () => {
        if (session) {
            try {
                console.log('Calling backend to start game with sessionId:', session.id);
                const response = await sessionApi.startGame(session.id, {});
                console.log('Game started response:', response);

                // Update local state with response
                const updatedSession: GameSession = {
                    id: response.id,
                    gameCode: response.gameCode,
                    status: response.status as 'LOBBY' | 'RUNNING' | 'FINISHED',
                    hostName: session.hostName,
                    players: response.players ? response.players.length : session.players,
                    maxPlayers: response.maxPlayers,
                    playersList: response.players as GameSession['playersList']
                };
                setSession(updatedSession);
                sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));

            } catch (error) {
                console.error('Error starting game:', error);
                setErrorMessage('Fehler beim Starten des Spiels. Bitte versuchen Sie es später erneut.');
            }
        }
    };

    const handleLogout = () => {
        logout();
        sessionStorage.removeItem('currentSession');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('playerName');
        navigate('/login');
    };

    const handleBackToLobby = async () => {
        const sessionData = sessionStorage.getItem('currentSession');

        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const result = await sessionApi.leaveSession(session.id);
                console.log('Session after leaving:', result);

                // If session is deleted (result is null or empty), just navigate
                if (!result) {
                    console.log('Session was deleted');
                }
            } catch (error) {
                console.error('Error leaving session:', error);
            }
        }

        sessionStorage.removeItem('currentSession');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('playerName');
        navigate('/lobby');
    };

    return (
        <div className="session-waiting-page">
            {showFactionDialog && session && user && (
                <FactionSelectionDialog
                    sessionId={session.id}
                    userId={user.id}
                    playerName={user.username}
                    onFactionSelected={handleFactionSelected}
                    onReadyClicked={handleReadyClicked}
                    isLoading={false}
                    selectedFaction={selectedFaction}
                    isReady={isPlayerReady}
                    readyStatus={readyStatus || undefined}
                />
            )}
            {!showFactionDialog && (
            <div className="session-waiting-panel">
                <h1>Crown of the Seas</h1>
                <p className="subtitle">Session Warteraum</p>

                {errorMessage && (
                    <div className="error-message">
                        <p>{errorMessage}</p>
                    </div>
                )}

                {session ? (
                    <>
                        <div className="session-info">
                            <div className="info-box">
                                <label>Session Code</label>
                                <code className="code-display">{session.gameCode}</code>
                            </div>

                            <div className="info-box join-link-box">
                                <label>Join-Link:</label>
                                <div className="link-container">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/join/${session.gameCode}`}
                                        readOnly
                                        className="join-link-input"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/join/${session.gameCode}`);
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
                            <h3>Spieler ({session.players}/{session.maxPlayers})</h3>
                            <div className="players-list">
                                {playerList && playerList.length > 0 ? (
                                    playerList.map((player, idx) => (
                                        <div key={idx} className="player-item">
                                            <span className="player-name">{player.playerName}</span>
                                            {player.faction && (
                                                <span className="player-faction">{player.faction}</span>
                                            )}
                                            {player.isHost && <span className="host-badge">HOST</span>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-players">
                                        {userRole === 'host' ? 'Warte auf Spieler...' : 'Warte auf Host zum Starten...'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="websocket-status">
                            ● WebSocket: {isConnected ? 'Connected' : 'Connecting...'}
                        </div>

                        <div className="button-group">
                            {userRole === 'host' && session?.status === 'LOBBY' && (
                                <button onClick={handleStartGame} className="auth-btn start-btn">
                                    Spiel Starten
                                </button>
                            )}

                            <button onClick={handleBackToLobby} className="auth-btn secondary-btn">
                                Zurück
                            </button>

                            <button onClick={handleLogout} className="auth-btn secondary-btn">
                                Ausloggen
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
            )}
        </div>
    );
}

