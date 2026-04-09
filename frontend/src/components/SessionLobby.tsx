import React, { useState } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import '../styles/sessionLobby.css';

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
        duration: '1:00:00' // HH:MM:SS format
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
            const [hours, minutes, seconds] = createForm.duration.split(':').map(Number);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            const durationStr = `PT${totalSeconds}S`;

            await createSession({
                hostUserId: currentUserId,
                hostName: createForm.hostName,
                maxPlayers: createForm.maxPlayers,
                tickRateSeconds: createForm.tickRateSeconds,
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
                userId: currentUserId,
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
                    <h2>Game Lobby</h2>

                    <div className="session-details">
                        <div className="detail-row">
                            <span className="label">Game Code:</span>
                            <span className="value code">{session.gameCode}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Players:</span>
                            <span className="value">{session.players.length} / {session.maxPlayers}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Tick Rate:</span>
                            <span className="value">{session.tickRateSeconds}s</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Status:</span>
                            <span className="value status">{session.status}</span>
                        </div>
                    </div>

                    <div className="players-list">
                        <h3>Players ({session.players.length})</h3>
                        <ul>
                            {session.players.map((player) => (
                                <li key={player.id} className={player.isHost ? 'host' : ''}>
                                    <span className="player-name">{player.playerName}</span>
                                    {player.isHost && <span className="host-badge">Host</span>}
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
                            {loading ? 'Starting...' : 'Start Game'}
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
                        Create Game
                    </button>
                    <button
                        className={`tab ${activeTab === 'join' ? 'active' : ''}`}
                        onClick={() => setActiveTab('join')}
                    >
                        Join Game
                    </button>
                </div>

                {activeTab === 'create' && (
                    <form onSubmit={handleCreateSession} className="form">
                        <div className="form-group">
                            <label>Your Name</label>
                            <input
                                type="text"
                                value={createForm.hostName}
                                onChange={(e) =>
                                    setCreateForm({ ...createForm, hostName: e.target.value })
                                }
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Max Players</label>
                                <select
                                    value={createForm.maxPlayers}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            maxPlayers: parseInt(e.target.value)
                                        })
                                    }
                                >
                                    <option value={2}>2 Players</option>
                                    <option value={3}>3 Players</option>
                                    <option value={4}>4 Players</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tick Rate (seconds)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={createForm.tickRateSeconds}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            tickRateSeconds: parseInt(e.target.value)
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Game Duration (HH:MM:SS)</label>
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
                            {loading ? 'Creating...' : 'Create Game'}
                        </button>
                    </form>
                )}

                {activeTab === 'join' && (
                    <form onSubmit={handleJoinSession} className="form">
                        <div className="form-group">
                            <label>Game Code</label>
                            <input
                                type="text"
                                value={joinForm.gameCode}
                                onChange={(e) =>
                                    setJoinForm({ ...joinForm, gameCode: e.target.value })
                                }
                                placeholder="Enter game code"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Your Name</label>
                            <input
                                type="text"
                                value={joinForm.playerName}
                                onChange={(e) =>
                                    setJoinForm({ ...joinForm, playerName: e.target.value })
                                }
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join Game'}
                        </button>
                    </form>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

