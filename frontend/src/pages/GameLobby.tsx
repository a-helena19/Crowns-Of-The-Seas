import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessionContext } from '../context/useSessionContext';
import { useAudioSettings } from '../audio/AudioSettingsContext';
import audioEngine from '../audio/AudioEngine';
import '../style/gameLobby.css';

export default function GameLobby() {
    const { user, logout } = useAuth();
    const { createSession, joinSession } = useSessionContext();
    const { settings, setMusicEnabled, setSfxEnabled, setMusicVolume, setSfxVolume } = useAudioSettings();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [error, setError] = useState('');

    // Audio-Menü
    const [audioMenuOpen, setAudioMenuOpen] = useState(false);
    const audioMenuRef = useRef<HTMLDivElement | null>(null);

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

    function showError(msg: string) {
        audioEngine.playSfx('error');
        setError(msg);
    }

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!createForm.hostName.trim()) {
            showError('Bitte gib einen Namen ein.');
            return;
        }

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

        const newSession = await createSession(
            createForm.hostName,
            createForm.maxPlayers,
            createForm.tickRateSeconds,
            totalTicks,
            isoDuration
        );

        if (!newSession) {
            showError('Fehler beim Erstellen der Session. Ist das Backend aktiv?');
            audioEngine.playSfx('error');
            return;
        }
        audioEngine.playSfx('buttonClick');

        sessionStorage.setItem('currentSession', JSON.stringify(newSession));
        sessionStorage.setItem('userRole', 'host');
        navigate('/session-waiting');
    };

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!joinForm.gameCode.trim()) {
            showError('Bitte gib einen Spielcode ein.');
            return;
        }

        if (!joinForm.playerName.trim()) {
            showError('Bitte gib einen Namen ein.');
            return;
        }

        try {
            const session = await joinSession(joinForm.gameCode, joinForm.playerName);

            if (session) {
                audioEngine.playSfx('buttonClick');
                sessionStorage.setItem('currentSession', JSON.stringify(session));
                sessionStorage.setItem('userRole', 'guest');
                sessionStorage.setItem('playerName', joinForm.playerName);
                navigate('/session-waiting');
            }
        } catch (error: unknown) {
            console.error('Error joining session:', error);

            const axiosError = error as { response?: { data?: { code?: string; message?: string }; status?: number } };

            if (axiosError.response?.data?.code === 'PLAYER_ALREADY_IN_SESSION') {
                showError('Du bist bereits dieser Session beigetreten!');
            } else if (axiosError.response?.data?.code === 'SESSION_FULL') {
                showError('Diese Session ist voll.');
            } else if (axiosError.response?.data?.code === 'SESSION_NOT_FOUND') {
                showError('Session mit diesem Code nicht gefunden. Ist das Backend aktiv?');
            } else if (axiosError.response?.status === 404) {
                showError('Session mit diesem Code nicht gefunden. Ist das Backend aktiv?');
            } else if (axiosError.response?.status === 409) {
                showError('Konflikt beim Beitritt - versuche es später erneut.');
            } else if (axiosError.response?.data?.message) {
                showError(axiosError.response.data.message);
            } else {
                showError('Fehler beim Beitritt zur Session. Bitte versuche es später erneut.');
            }
        }
    };

    const handleLogout = () => {
        audioEngine.playSfx('buttonClick');
        logout();
        navigate('/login');
    };

    useEffect(() => {
        // playMusic immer aufrufen. Dadurch wird die Musik korrekt gestartet, sobald sie wieder
        // aktiviert wird – z.B. nach einem Reload im stummgeschalteten Zustand.
        audioEngine.playMusic('lobby');
        return () => {};
    }, []);

    // Audio-Menü: Klick außerhalb schließt es
    useEffect(() => {
        if (!audioMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
                setAudioMenuOpen(false);
            }
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handler);
        };
    }, [audioMenuOpen]);

    return (
        <div className="game-lobby-page">
            <div className="lobby-container">
                <div className="lobby-header">
                    <h1>Crown of the Seas</h1>
                    <p className="welcome-text">Willkommen, {user?.username}!</p>

                    <div className="lobby-header-actions">
                        {user?.role === "ADMIN" && (
                            <button className="admin-link-btn" onClick={() => {navigate("/admin"); audioEngine.playSfx('buttonClick');}}>
                                ⚙ Verwaltung
                            </button>
                        )}

                        {/* Audio-Menü */}
                        <div className="lobby-audio-wrapper" ref={audioMenuRef}>
                            <button
                                type="button"
                                className={`lobby-menu-btn ${audioMenuOpen ? 'is-open' : ''}`}
                                onClick={() => {setAudioMenuOpen(o => !o); audioEngine.playSfx('buttonClick');}}
                                title="Einstellungen"
                            >
                                ☰
                            </button>

                            {audioMenuOpen && (
                                <div className="lobby-audio-popover">
                                    <h3 className="lobby-audio-title">Audio</h3>

                                    <div className="lobby-audio-row">
                                        <span className="lobby-audio-label">🎵 Musik</span>
                                        <div className="lobby-audio-controls">
                                            <button
                                                className={`lobby-audio-toggle ${settings.musicEnabled ? 'on' : 'off'}`}
                                                onClick={() => {setMusicEnabled(!settings.musicEnabled); audioEngine.playSfx('buttonClick');}}
                                            >
                                                {settings.musicEnabled ? 'AN' : 'AUS'}
                                            </button>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={Math.round(settings.musicVolume * 100)}
                                                onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                                                disabled={!settings.musicEnabled}
                                                className="lobby-audio-slider"
                                            />
                                            <span className="lobby-audio-pct">
                                                {Math.round(settings.musicVolume * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="lobby-audio-row">
                                        <span className="lobby-audio-label">🔔 Effekte</span>
                                        <div className="lobby-audio-controls">
                                            <button
                                                className={`lobby-audio-toggle ${settings.sfxEnabled ? 'on' : 'off'}`}
                                                onClick={() => {setSfxEnabled(!settings.sfxEnabled); audioEngine.playSfx('buttonClick');}}
                                            >
                                                {settings.sfxEnabled ? 'AN' : 'AUS'}
                                            </button>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={Math.round(settings.sfxVolume * 100)}
                                                onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
                                                disabled={!settings.sfxEnabled}
                                                className="lobby-audio-slider"
                                            />
                                            <span className="lobby-audio-pct">
                                                {Math.round(settings.sfxVolume * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="lobby-menu-divider" />

                                    <button className="lobby-menu-logout" onClick={handleLogout}>
                                        Ausloggen
                                    </button>

                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lobby-content">
                    <div className="form-section">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                                onClick={() => {
                                    audioEngine.playSfx('buttonClick');
                                    setActiveTab('create');
                                    setError('');
                                }}
                            >
                                Neue Session
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
                                onClick={() => {
                                    audioEngine.playSfx('buttonClick');
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
                                        placeholder="z.B. Kapitän Jack"
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
                                    <label htmlFor="tickRate">Tickrate (Spieltempo):</label>
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
                                    Session erstellen
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
                                        placeholder="z.B. Kapitän Jack"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="gameCode">Spielcode:</label>
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