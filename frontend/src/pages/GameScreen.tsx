import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../style/auth.css';

interface GameSession {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
}

export default function GameScreen() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [session, setSession] = useState<GameSession | null>(null);
    const [userRole, setUserRole] = useState<'host' | 'guest'>('guest');
    const [gameStatus, setGameStatus] = useState<'LOBBY' | 'RUNNING' | 'FINISHED'>('LOBBY');

    useEffect(() => {
        // Load session from sessionStorage
        const sessionData = sessionStorage.getItem('currentSession');
        const role = sessionStorage.getItem('userRole') as 'host' | 'guest';

        if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            setSession(parsedSession);
            setGameStatus(parsedSession.status);
        }

        if (role) {
            setUserRole(role);
        }
    }, []);

    const handleStartGame = () => {
        if (session) {
            const updatedSession = {
                ...session,
                status: 'RUNNING' as const
            };
            setSession(updatedSession);
            setGameStatus('RUNNING');
            sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));
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
        switch (gameStatus) {
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
        switch (gameStatus) {
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
                        {userRole === 'host' && gameStatus === 'LOBBY' && (
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
