import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessionContext } from '../context/useSessionContext';
import '../style/gameLobby.css';

export default function GameLobby() {
    const { user, logout } = useAuth();
    const { createSession, joinSession } = useSessionContext();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [error, setError] = useState('');

    // Create Session Form State
    const [createForm, setCreateForm] = useState({
        hostName: user?.username || '',
        maxPlayers: 2,
        tickRateSeconds: 3,
        duration: '1h'
    });

    const [joinForm, setJoinForm] = useState({
        gameCode: '',
        playerName: user?.username || ''
    });

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!createForm.hostName.trim()) {
            setError('Bitte gib einen Namen ein.');
            return;
        }

        // Convert duration from "1h" to "PT1H" format
        const durationMap: { [key: string]: string } = {
            '20s': 'PT20S',
            '1m': 'PT1M',
            '1h': 'PT1H',
            '2h': 'PT2H',
            '3h': 'PT3H',
            '4h': 'PT4H'
        };
        const isoDuration = durationMap[createForm.duration] || 'PT1H';
        const durationSeconds = { '20s': 20, '1m': 60,'1h': 3600, '2h': 7200, '3h': 10800, '4h': 14400 }[createForm.duration] ?? 3600;
        const totalTicks = Math.round(durationSeconds / createForm.tickRateSeconds);

        // Create session using context (now async)
        const newSession = await createSession(
            createForm.hostName,
            createForm.maxPlayers,
            createForm.tickRateSeconds,
            totalTicks,
            isoDuration
        );

        if (!newSession) {
            setError('Fehler beim Erstellen der Session. Ist das Backend aktiv?');
            return;
        }

        // Redirect to session waiting screen
        sessionStorage.setItem('currentSession', JSON.stringify(newSession));
        sessionStorage.setItem('userRole', 'host');
        navigate('/session-waiting');
    };

    const handleJoinSession = async (e: React.FormEvent) => {
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

        // Try to join session using context
        try {
            const session = await joinSession(joinForm.gameCode, joinForm.playerName);

            if (session) {
                // Redirect to session waiting screen
                sessionStorage.setItem('currentSession', JSON.stringify(session));
                sessionStorage.setItem('userRole', 'guest');
                sessionStorage.setItem('playerName', joinForm.playerName);
                navigate('/session-waiting');
            }
        } catch (error: unknown) {
            console.error('Error joining session:', error);

            const axiosError = error as { response?: { data?: { code?: string; message?: string }; status?: number } };

            if (axiosError.response?.data?.code === 'PLAYER_ALREADY_IN_SESSION') {
                setError('Du bist bereits dieser Session beigetreten!');
            } else if (axiosError.response?.data?.code === 'SESSION_FULL') {
                setError('Diese Session ist voll.');
            } else if (axiosError.response?.data?.code === 'SESSION_NOT_FOUND') {
                setError('Session mit diesem Code nicht gefunden. Ist das Backend aktiv?');
            } else if (axiosError.response?.status === 404) {
                setError('Session mit diesem Code nicht gefunden. Ist das Backend aktiv?');
            } else if (axiosError.response?.status === 409) {
                setError('Konflikt beim Beitritt - versuche es später erneut.');
            } else if (axiosError.response?.data?.message) {
                setError(axiosError.response.data.message);
            } else {
                setError('Fehler beim Beitritt zur Session. Bitte versuche es später erneut.');
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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

                                <div className="form-group">
                                    <label htmlFor="tickRate">Tick Rate (Spieltempo):</label>
                                    <select
                                        id="tickRate"
                                        value={createForm.tickRateSeconds}
                                        onChange={(e) => setCreateForm({ ...createForm, tickRateSeconds: parseInt(e.target.value) })}
                                    >
                                        <option value={3}>3 Sekunden</option>
                                        <option value={10}>10 Sekunden</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="duration">Spieldauer:</label>
                                    <select
                                        id="duration"
                                        value={createForm.duration}
                                        onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                                    >
                                        <option value="20s">20 Sekunden (Test)</option>
                                        <option value="1m">1 Minute (Test)</option>
                                        <option value="1h">1 Stunde</option>
                                        <option value="2h">2 Stunden</option>
                                        <option value="3h">3 Stunden</option>
                                        <option value="4h">4 Stunden</option>
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
                </div>
            </div>
        </div>
    );
}

