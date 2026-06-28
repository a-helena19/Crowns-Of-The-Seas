import React, { useState } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import '../style/sessionLobby.css';

interface SessionLobbyProps {
    currentUserId: string;
    onGameStarted?: (sessionId: string) => void;
}

export const SessionLobby: React.FC<SessionLobbyProps> = ({ currentUserId, onGameStarted }) => {
    const { session, loading, error, createSession, joinSession, startGame } = useGameSession();

    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    // Create Session Form State
    const [createForm, setCreateForm] = useState({
        hostName: '',
        maxPlayers: 2,
        tickRateSeconds: 5,
        duration: '01:00:00' // HH:MM:SS format
    });

    // Join Session Form State
    const [joinForm, setJoinForm] = useState({
        gameCode: '',
        playerName: ''
    });

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert duration string to ISO 8601 format
            const parts = createForm.duration.split(':');
            if (parts.length !== 3) {
                throw new Error('Duration must be in HH:MM:SS format');
            }

            const hours = parseInt(parts[0], 10) || 0;
            const minutes = parseInt(parts[1], 10) || 0;
            const seconds = parseInt(parts[2], 10) || 0;

            if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
                throw new Error('Invalid duration format');
            }

            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            const durationStr = `PT${totalSeconds}S`;
            const totalTicks = Math.round(totalSeconds / createForm.tickRateSeconds);


            await createSession({
                hostName: createForm.hostName,
                maxPlayers: createForm.maxPlayers,
                tickRateSeconds: createForm.tickRateSeconds,
                totalTicks,
                duration: durationStr
            });
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await joinSession({
                gameCode: joinForm.gameCode,
                playerName: joinForm.playerName
            });
        } catch (err) {
            console.error('Failed to join session:', err);
        }
    };

    const handleStartGame = async () => {
        try {
            await startGame(currentUserId);
            if (session?.id) {
                onGameStarted?.(session.id);
            }
        } catch (err) {
            console.error('Failed to start game:', err);
        }
    };

    // If session exists, show session lobby
    if (session) {
        return (
            <div className="session-lobby-container">
                <div className="session-info-card">
                    <h2>Spiel-Lobby</h2>

                    <div className="session-details">
                        <div className="detail-row">
                            <span className="label">Spielcode:</span>
                            <span className="value code">{session.gameCode}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Spieler:</span>
                            <span className="value">{session.players.length} / {session.maxPlayers}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Tickrate:</span>
                            <span className="value">{session.tickRateSeconds}s</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Status:</span>
                            <span className="value status">{formatSessionStatus(session.status)}</span>
                        </div>
                    </div>

                    <div className="players-list">
                        <h3>Spieler ({session.players.length})</h3>
                        <ul>
                            {session.players.map((player) => (
                                <li key={player.id} className={player.isHost ? 'host' : ''}>
                                    <span className="player-name">{player.playerName}</span>
                                    {player.isHost && <span className="host-badge">Gastgeber</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {session.players.some((p) => p.userId === currentUserId && p.isHost) && (
                        <button
                            className="btn btn-primary btn-block"
                            onClick={handleStartGame}
                            disabled={loading}
                        >
                            {loading ? 'Startet...' : 'Spiel starten'}
                        </button>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        );
    }

    // Show create/join form
    return (
        <div className="session-lobby-container">
            <div className="lobby-card">
                <h1>Crown of the Seas</h1>

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Spiel erstellen
                    </button>
                    <button
                        className={`tab ${activeTab === 'join' ? 'active' : ''}`}
                        onClick={() => setActiveTab('join')}
                    >
                        Spiel beitreten
                    </button>
                </div>

                {activeTab === 'create' && (
                    <form onSubmit={handleCreateSession} className="form">
                        <div className="form-group">
                            <label>Dein Name</label>
                            <input
                                type="text"
                                value={createForm.hostName}
                                onChange={(e) =>
                                    setCreateForm({ ...createForm, hostName: e.target.value })
                                }
                                placeholder="Dein Name"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Max. Spieler</label>
                                <select
                                    value={String(createForm.maxPlayers)}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            maxPlayers: parseInt(e.target.value, 10)
                                        })
                                    }
                                >
                                    <option value="2">2 Spieler</option>
                                    <option value="3">3 Spieler</option>
                                    <option value="4">4 Spieler</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tickrate (Sekunden)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={String(createForm.tickRateSeconds)}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            tickRateSeconds: parseInt(e.target.value, 10) || 5
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Spieldauer (HH:MM:SS)</label>
                            <input
                                type="text"
                                value={createForm.duration}
                                onChange={(e) =>
                                    setCreateForm({ ...createForm, duration: e.target.value })
                                }
                                placeholder="01:00:00"
                                pattern="\d{1,2}:\d{2}:\d{2}"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Wird erstellt...' : 'Spiel erstellen'}
                        </button>
                    </form>
                )}

                {activeTab === 'join' && (
                    <form onSubmit={handleJoinSession} className="form">
                        <div className="form-group">
                            <label>Spielcode</label>
                            <input
                                type="text"
                                value={joinForm.gameCode}
                                onChange={(e) =>
                                    setJoinForm({ ...joinForm, gameCode: e.target.value })
                                }
                                placeholder="Spielcode eingeben"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Dein Name</label>
                            <input
                                type="text"
                                value={joinForm.playerName}
                                onChange={(e) =>
                                    setJoinForm({ ...joinForm, playerName: e.target.value })
                                }
                                placeholder="Dein Name"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Tritt bei...' : 'Spiel beitreten'}
                        </button>
                    </form>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

function formatSessionStatus(status: string) {
    const labels: Record<string, string> = {
        WAITING: "Wartet",
        ACTIVE: "Aktiv",
        RUNNING: "Läuft",
        FINISHED: "Beendet",
        COMPLETED: "Abgeschlossen",
    };
    return labels[status] ?? status;
}

