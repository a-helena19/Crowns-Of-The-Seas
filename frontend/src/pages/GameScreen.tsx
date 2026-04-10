import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGameSessionWebSocket } from '../hooks/useGameSessionWebSocket';
import { sessionApi } from '../api/sessionApi';
import '../style/auth.css';

interface GameSession {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
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
    }>;
    eventType: string;
}

export default function GameScreen() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [session, setSession] = useState<GameSession | null>(null);
    const [userRole, setUserRole] = useState<'host' | 'guest'>('guest');

    useEffect(() => {
        // Load session from sessionStorage
        const sessionData = sessionStorage.getItem('currentSession');
        const role = sessionStorage.getItem('userRole') as 'host' | 'guest';

        if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setSession(parsedSession);
        }

        if (role) {
            setUserRole(role);
        }
    }, []);

    // WebSocket for real-time updates
    const { isConnected } = useGameSessionWebSocket({
        sessionId: session?.id || null,
        onSessionUpdate: (event: SessionUpdateEvent) => {
            console.log('Session update received:', event);

            // Update session with new data
            if (session) {
                const updatedSession: GameSession = {
                    ...session,
                    status: event.status,
                    players: event.playerCount,
                    maxPlayers: event.maxPlayers
                };
                setSession(updatedSession);
                sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));
            }
        }
    });

    const handleStartGame = async () => {
        if (session) {
            try {
                console.log('Calling backend to start game with sessionId:', session.id);
                // Call backend API to start game
                // This will trigger the WebSocket broadcast to all connected clients
                const response = await sessionApi.startGame(session.id, {});
                console.log('Game started response:', response);

                // Update local state with response
                const updatedSession: GameSession = {
                    id: response.id,
                    gameCode: response.gameCode,
                    status: response.status as 'LOBBY' | 'RUNNING' | 'FINISHED',
                    hostName: session.hostName,
                    players: response.players ? response.players.length : session.players,
                    maxPlayers: response.maxPlayers
                };
                setSession(updatedSession);
                sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));
            } catch (error) {
                console.error('Error starting game:', error);
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

    const handleBackToLobby = () => {
        sessionStorage.removeItem('currentSession');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('playerName');
        navigate('/lobby');
    };

    const getStatusColor = () => {
        const status = session?.status || 'LOBBY';
        switch (status) {
            case 'RUNNING':
                return '#ffd700';
            case 'LOBBY':
                return '#90ee90';
            case 'FINISHED':
                return '#8a8a8a';
            default:
                return '#f5e6c8';
        }
    };

    const getStatusText = () => {
        const status = session?.status || 'LOBBY';
        switch (status) {
            case 'RUNNING':
                return 'LÄUFT';
            case 'LOBBY':
                return 'WARTET';
            case 'FINISHED':
                return 'BEENDET';
            default:
                return 'UNBEKANNT';
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a0e07 0%, #2d1810 100%)',
            color: '#f5e6c8',
            fontFamily: "'Arial', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <h1 style={{
                color: '#d1ba7e',
                fontSize: '48px',
                textShadow: '2px 2px 0 #1a0a02',
                margin: '0 0 10px 0'
            }}>
                Crown of the Seas
            </h1>

            <div style={{
                fontSize: '12px',
                color: isConnected ? '#90ee90' : '#ff6b6b',
                marginBottom: '20px'
            }}>
                ● WebSocket: {isConnected ? 'Connected' : 'Connecting...'}
            </div>

            {session ? (
                <div style={{
                    background: 'rgba(45, 24, 16, 0.9)',
                    border: '2px solid #d1ba7e',
                    borderRadius: '8px',
                    padding: '30px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: 'rgba(30, 20, 15, 0.8)',
                        borderRadius: '6px',
                        border: `3px solid ${getStatusColor()}`
                    }}>
                        <p style={{
                            margin: '0 0 10px 0',
                            color: '#8a7a5a',
                            fontSize: '14px'
                        }}>
                            Spielstatus
                        </p>
                        <h2 style={{
                            margin: '0',
                            color: getStatusColor(),
                            fontSize: '32px',
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                        }}>
                            {getStatusText()}
                        </h2>
                    </div>

                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'rgba(30, 20, 15, 0.8)',
                        borderRadius: '6px',
                        border: '1px solid #8a7a5a'
                    }}>
                        <p style={{ margin: '5px 0', color: '#8a7a5a', fontSize: '12px' }}>
                            Session Code
                        </p>
                        <code style={{
                            fontSize: '20px',
                            color: '#ffd700',
                            fontFamily: "'Courier New', monospace"
                        }}>
                            {session.gameCode}
                        </code>
                    </div>

                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'rgba(30, 20, 15, 0.8)',
                        borderRadius: '6px',
                        border: '1px solid #8a7a5a'
                    }}>
                        <p style={{ margin: '5px 0 10px 0', color: '#d1ba7e', fontSize: '12px', fontWeight: 'bold' }}>
                            Join-Link:
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                value={`${window.location.origin}/join/${session.gameCode}`}
                                readOnly
                                style={{
                                    flex: 1,
                                    background: 'rgba(30, 20, 15, 0.9)',
                                    color: '#ffd700',
                                    border: '1px solid rgba(209, 186, 126, 0.5)',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontFamily: "'Courier New', monospace",
                                    fontSize: '11px',
                                    cursor: 'text'
                                }}
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join/${session.gameCode}`);
                                    alert('Link kopiert!');
                                }}
                                style={{
                                    background: '#8B4513',
                                    color: '#f5e6c8',
                                    border: '1px solid #d1ba7e',
                                    padding: '8px 14px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#a0522d';
                                    e.currentTarget.style.boxShadow = '0 0 8px rgba(209, 186, 126, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#8B4513';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                Kopieren
                            </button>
                        </div>
                    </div>

                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'rgba(30, 20, 15, 0.8)',
                        borderRadius: '6px',
                        border: '1px solid #8a7a5a'
                    }}>
                        <p style={{ margin: '5px 0', color: '#d1ba7e', fontSize: '12px' }}>
                            Host: {session.hostName}
                        </p>
                        <p style={{ margin: '5px 0', color: '#c9b8a8', fontSize: '12px' }}>
                            Spieler: {session.players}/{session.maxPlayers}
                        </p>
                        <p style={{ margin: '5px 0', color: '#c9b8a8', fontSize: '12px' }}>
                            Rolle: {userRole === 'host' ? 'Host' : 'Gast'}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {userRole === 'host' && session?.status === 'LOBBY' && (
                            <button
                                onClick={handleStartGame}
                                style={{
                                    background: '#8B4513',
                                    color: '#f5e6c8',
                                    border: '2px solid #d1ba7e',
                                    padding: '12px 25px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#a0522d';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(209, 186, 126, 0.5)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#8B4513';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                Spiel Starten
                            </button>
                        )}

                        <button
                            onClick={handleBackToLobby}
                            style={{
                                background: 'transparent',
                                color: '#c9b8a8',
                                border: '2px solid #8a7a5a',
                                padding: '12px 25px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#d1ba7e';
                                e.currentTarget.style.color = '#d1ba7e';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#8a7a5a';
                                e.currentTarget.style.color = '#c9b8a8';
                            }}
                        >
                            Zurück zur Lobby
                        </button>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                color: '#c9b8a8',
                                border: '2px solid #8a7a5a',
                                padding: '12px 25px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#d1ba7e';
                                e.currentTarget.style.color = '#d1ba7e';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#8a7a5a';
                                e.currentTarget.style.color = '#c9b8a8';
                            }}
                        >
                            Ausloggen
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'rgba(45, 24, 16, 0.9)',
                    border: '2px solid #d1ba7e',
                    borderRadius: '8px',
                    padding: '30px',
                    textAlign: 'center',
                    maxWidth: '500px',
                }}>
                    <p style={{ color: '#c9b8a8', fontSize: '16px', marginBottom: '20px' }}>
                        Keine Session gefunden.
                    </p>
                    <button
                        onClick={handleBackToLobby}
                        style={{
                            background: '#8B4513',
                            color: '#f5e6c8',
                            border: '2px solid #d1ba7e',
                            padding: '12px 25px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Zurück zur Lobby
                    </button>
                </div>
            )}
        </div>
    );
}
