import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/gameLobby.css';

export interface Session {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
}

export default function GameLobby() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [error, setError] = useState('');

    // Create Session Form State
    const [createForm, setCreateForm] = useState({
        hostName: user?.username || '',
        maxPlayers: 2,
    });

    // Join Session Form State
    const [joinForm, setJoinForm] = useState({
        gameCode: '',
        playerName: user?.username || ''
    });

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!createForm.hostName.trim()) {
            setError('Bitte gib einen Namen ein.');
            return;
        }

        // Generate random game code
        const gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();

        const newSession: Session = {
            id: 'session-' + Math.random().toString(36).substr(2, 9),
            gameCode,
            status: 'LOBBY',
            hostName: createForm.hostName,
            players: 1,
            maxPlayers: createForm.maxPlayers
        };

        setSessions([...sessions, newSession]);

        // Redirect to game with session data
        sessionStorage.setItem('currentSession', JSON.stringify(newSession));
        sessionStorage.setItem('userRole', 'host');
        navigate('/game');
    };

    const handleJoinSession = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!joinForm.gameCode.trim()) {
            setError('Bitte gib einen Game Code ein.');
            return;
        }

        if (!joinForm.playerName.trim()) {
            setError('Bitte gib einen Namen ein.');
            return;
        }

        // Find session by code
        const session = sessions.find(s => s.gameCode === joinForm.gameCode.toUpperCase());
        if (!session) {
            setError('Session mit diesem Code nicht gefunden.');
            return;
        }

        if (session.status !== 'LOBBY') {
            setError('Diese Session läuft bereits oder ist beendet.');
            return;
        }

        if (session.players >= session.maxPlayers) {
            setError('Diese Session ist voll.');
            return;
        }

        // Join session
        const updatedSession = {
            ...session,
            players: session.players + 1
        };

        setSessions(sessions.map(s => s.id === session.id ? updatedSession : s));

        // Redirect to game with session data
        sessionStorage.setItem('currentSession', JSON.stringify(updatedSession));
        sessionStorage.setItem('userRole', 'guest');
        sessionStorage.setItem('playerName', joinForm.playerName);
        navigate('/game');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'RUNNING':
                return 'status-running';
            case 'FINISHED':
                return 'status-finished';
            default:
                return 'status-lobby';
        }
    };

    return (
        <div className="game-lobby-page">
            <div className="lobby-container">
                <div className="lobby-header">
                    <h1>Crown of the Seas</h1>
                    <p className="welcome-text">Willkommen, {user?.username}!</p>
                    <button className="logout-btn" onClick={handleLogout}>
                        Ausloggen
                    </button>
                </div>

                <div className="lobby-content">
                    <div className="form-section">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('create');
                                    setError('');
                                }}
                            >
                                Neue Session
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('join');
                                    setError('');
                                }}
                            >
                                Mit Code Beitreten
                            </button>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        {activeTab === 'create' && (
                            <form onSubmit={handleCreateSession} className="lobby-form">
                                <div className="form-group">
                                    <label htmlFor="hostName">Dein Name:</label>
                                    <input
                                        id="hostName"
                                        type="text"
                                        value={createForm.hostName}
                                        onChange={(e) => setCreateForm({ ...createForm, hostName: e.target.value })}
                                        placeholder="z.B. Captain Jack"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="maxPlayers">Max. Spieler:</label>
                                    <select
                                        id="maxPlayers"
                                        value={createForm.maxPlayers}
                                        onChange={(e) => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })}
                                    >
                                        <option value={2}>2 Spieler</option>
                                        <option value={3}>3 Spieler</option>
                                        <option value={4}>4 Spieler</option>
                                    </select>
                                </div>

                                <button type="submit" className="submit-btn">
                                    Session Erstellen
                                </button>
                            </form>
                        )}

                        {activeTab === 'join' && (
                            <form onSubmit={handleJoinSession} className="lobby-form">
                                <div className="form-group">
                                    <label htmlFor="playerName">Dein Name:</label>
                                    <input
                                        id="playerName"
                                        type="text"
                                        value={joinForm.playerName}
                                        onChange={(e) => setJoinForm({ ...joinForm, playerName: e.target.value })}
                                        placeholder="z.B. Captain Jack"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="gameCode">Game Code:</label>
                                    <input
                                        id="gameCode"
                                        type="text"
                                        value={joinForm.gameCode}
                                        onChange={(e) => setJoinForm({ ...joinForm, gameCode: e.target.value.toUpperCase() })}
                                        placeholder="z.B. ABC123"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-btn">
                                    Beitreten
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="sessions-section">
                        <h2>Verfügbare Sessions</h2>
                        {sessions.length === 0 ? (
                            <p className="no-sessions">Noch keine Sessions verfügbar.</p>
                        ) : (
                            <div className="sessions-list">
                                {sessions.map((session) => (
                                    <div key={session.id} className="session-card">
                                        <div className="session-header">
                                            <h3>{session.hostName}'s Session</h3>
                                            <span className={`status-badge ${getStatusBadgeClass(session.status)}`}>
                                                {session.status === 'RUNNING' ? 'Läuft' : 'Wartet'}
                                            </span>
                                        </div>
                                        <div className="session-details">
                                            <p><strong>Code:</strong> <code>{session.gameCode}</code></p>
                                            <p><strong>Spieler:</strong> {session.players}/{session.maxPlayers}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

