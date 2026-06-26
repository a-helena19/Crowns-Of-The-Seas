import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessionContext } from '../context/useSessionContext';
import { useAudioSettings } from '../audio/AudioSettingsContext';
import { sessionApi } from '../api/sessionApi';
import type { SessionDTO } from '../types/session';
import audioEngine from '../audio/AudioEngine';
import UserEditModal from '../components/UserEditModal';
import HelpCenter from '../components/HelpCenter';
import { useFullscreen } from '../context/FullscreenContext';
import '../style/gameLobby.css';

export default function GameLobby() {
    const { user, logout } = useAuth();
    const { createSession, joinSession } = useSessionContext();
    const { settings, setMusicEnabled, setSfxEnabled, setMusicVolume, setSfxVolume } = useAudioSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');

    // Audio-Menü
    const [audioMenuOpen, setAudioMenuOpen] = useState(false);
    const audioMenuRef = useRef<HTMLDivElement | null>(null);
    const { isSupported: fullscreenSupported, isFullscreen, confirmExitFullscreen, requestRecommendedFullscreen } = useFullscreen();

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        if (user?.username) {
            setCreateForm(f => ({ ...f, hostName: user.username }));
            setJoinForm(f => ({ ...f, playerName: user.username }));
        }
    }, [user?.username]);

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

    // Aktive Sessions des Spielers (zum Wiederbeitreten)
    const [activeSessions, setActiveSessions] = useState<SessionDTO[]>([]);
    const [rejoiningId, setRejoiningId] = useState<string | null>(null);
    const runningSessions = activeSessions.filter(session => session.status === 'RUNNING');
    const activeAction =
        location.pathname.endsWith('/continue') ? 'continue'
            : location.pathname.endsWith('/join') ? 'join'
                : location.pathname.endsWith('/create') ? 'create'
                    : 'overview';

    const loadActiveSessions = useCallback(async () => {
        try {
            const sessions = await sessionApi.getActiveSessions();
            setActiveSessions(sessions);
        } catch (err) {
            console.warn('Konnte aktive Sessions nicht laden:', err);
        }
    }, []);

    useEffect(() => {
        loadActiveSessions();
        // Regelmäßig aktualisieren, damit Status/Spielerzahl aktuell bleiben.
        const id = window.setInterval(loadActiveSessions, 5000);
        return () => window.clearInterval(id);
    }, [loadActiveSessions]);

    // In eine aktive Session zurückkehren. Bei laufender Session (RUNNING) wird der
    // Spieler über das Backend wieder als verbunden markiert und direkt ins Spiel
    // geleitet; LOBBY/FACTION_SELECTION führen in den Wartebildschirm.
    const handleRejoin = async (session: SessionDTO) => {
        if (rejoiningId) return;
        setRejoiningId(session.id);
        setError('');
        try {
            let target = session;
            if (session.status === 'RUNNING') {
                target = await sessionApi.rejoinSession(session.id);
            }

            audioEngine.playSfx('buttonClick');
            sessionStorage.setItem('currentSession', JSON.stringify(target));

            const me = target.players.find(p => p.userId === user?.id);
            sessionStorage.setItem('userRole', me?.isHost ? 'host' : 'guest');

            if (target.status === 'RUNNING') {
                // Marker setzen, damit der GameScreen beim WS-Subscribe signalisiert,
                // dass dies ein Wieder-Beitritt ist (→ andere Spieler werden benachrichtigt).
                sessionStorage.setItem('rejoinUserId', user?.id ?? '');
                navigate('/game');
            } else {
                navigate('/session-waiting');
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number; data?: string } };
            if (axiosError.response?.status === 403) {
                showError('Du warst nicht Teil dieser Session.');
            } else if (axiosError.response?.status === 409) {
                showError('Diese Session läuft nicht mehr.');
            } else if (axiosError.response?.status === 404) {
                showError('Diese Session existiert nicht mehr.');
                loadActiveSessions();
            } else {
                showError('Wiederbeitritt fehlgeschlagen. Bitte versuche es erneut.');
            }
        } finally {
            setRejoiningId(null);
        }
    };

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
        // playMusic immer aufrufen – auch ohne vorherige Interaktion und auch im
        // stummgeschalteten Zustand. Bei deaktivierter Musik merkt sich die
        // AudioEngine nur den gewünschten Track ('lobby'), ohne ein Audio-Element
        // zu erzeugen. Dadurch wird die Musik korrekt gestartet, sobald sie wieder
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
        <>
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

                        <button
                            className="profile-edit-btn"
                            onClick={() => { setProfileModalOpen(true); audioEngine.playSfx('buttonClick'); }}
                            title="Profil bearbeiten"
                        >
                            👤 Profil
                        </button>

                        <button
                            className="profile-edit-btn lobby-help-btn"
                            onClick={() => { setHelpOpen(true); audioEngine.playSfx('buttonClick'); }}
                            title="Hilfecenter öffnen"
                        >
                            ❓ Hilfe
                        </button>

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

                                    {fullscreenSupported && (
                                        <button
                                            type="button"
                                            className="lobby-menu-fullscreen"
                                            onClick={() => {
                                                audioEngine.playSfx('buttonClick');
                                                const action = isFullscreen
                                                    ? confirmExitFullscreen()
                                                    : requestRecommendedFullscreen();

                                                void action.then(() => {
                                                    setAudioMenuOpen(false);
                                                });
                                            }}
                                        >
                                            {isFullscreen ? 'Vollbild beenden' : 'Vollbild öffnen'}
                                        </button>
                                    )}

                                    <button className="lobby-menu-logout" onClick={handleLogout}>
                                        Ausloggen
                                    </button>

                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`lobby-actions-panel ${activeAction === 'overview' ? 'is-overview' : 'is-subpage'}`}>
                    {activeAction === 'overview' && (
                        <div className="lobby-action-stack">
                            <button
                                type="button"
                                className={`lobby-action-btn ${runningSessions.length === 0 ? 'is-disabled' : ''}`}
                                onClick={() => {
                                    if (runningSessions.length === 0) return;
                                    audioEngine.playSfx('buttonClick');
                                    navigate('/lobby/continue');
                                    setError('');
                                }}
                                disabled={runningSessions.length === 0}
                            >
                                <span className="lobby-action-title">Spiel fortsetzen</span>
                                <span className="lobby-action-subtitle">
                                    {runningSessions.length > 0 ? `${runningSessions.length} laufende Session${runningSessions.length === 1 ? '' : 's'}` : 'Keine laufende Session verfügbar'}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="lobby-action-btn"
                                onClick={() => {
                                    audioEngine.playSfx('buttonClick');
                                    navigate('/lobby/create');
                                    setError('');
                                }}
                            >
                                <span className="lobby-action-title">Spiel erstellen</span>
                                <span className="lobby-action-subtitle">Ein neues Spiel hosten und starten</span>
                            </button>

                            <button
                                type="button"
                                className="lobby-action-btn"
                                onClick={() => {
                                    audioEngine.playSfx('buttonClick');
                                    navigate('/lobby/join');
                                    setError('');
                                }}
                            >
                                <span className="lobby-action-title">Spiel beitreten</span>
                                <span className="lobby-action-subtitle">Mit einem Code einer Session beitreten</span>
                            </button>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {activeAction === 'continue' && (
                        <div className="lobby-detail-panel">
                            <section className="active-sessions-section">
                                <h2 className="active-sessions-title">Laufende Sessions</h2>
                                {runningSessions.length === 0 ? (
                                    <p className="active-sessions-empty">
                                        Du hast aktuell keine laufende Session. Erstelle ein neues Spiel oder trete einer Session bei.
                                    </p>
                                ) : (
                                    <ul className="active-sessions-list">
                                        {runningSessions.map(s => {
                                            const me = s.players.find(p => p.userId === user?.id);
                                            const connectedCount = s.players.filter(p => !p.disconnected).length;
                                            const isRejoining = rejoiningId === s.id;

                                            return (
                                                <li key={s.id} className="active-session-card">
                                                    <div className="active-session-head">
                                                        <span className="active-session-code">{s.gameCode}</span>
                                                        <span className="active-session-status status-running">Läuft</span>
                                                    </div>

                                                    <div className="active-session-meta">
                                                        <span>👥 {connectedCount}/{s.maxPlayers} aktiv</span>
                                                        <span>📅 Tag {s.currentTick}/{s.totalTicks}</span>
                                                        {me?.disconnected && (
                                                            <span className="active-session-left-tag">verlassen</span>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="active-session-rejoin-btn"
                                                        onClick={() => handleRejoin(s)}
                                                        disabled={isRejoining || !!rejoiningId}
                                                    >
                                                        {isRejoining ? 'Trete bei …' : 'Spiel fortsetzen'}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        </div>
                    )}

                    {activeAction === 'create' && (
                        <div className="lobby-detail-panel">
                            <section className="lobby-form-card">
                                <h2>Spiel erstellen</h2>
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
                            </section>
                        </div>
                    )}

                    {activeAction === 'join' && (
                        <div className="lobby-detail-panel">
                            <section className="lobby-form-card">
                                <h2>Spiel beitreten</h2>
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
                            </section>
                        </div>
                    )}

                    {activeAction !== 'overview' && (
                        <button type="button" className="lobby-back-btn" onClick={() => navigate('/lobby')}>
                            <span className="lobby-back-icon">←</span>
                            <span>Zur Übersicht</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {profileModalOpen && (
            <UserEditModal onClose={() => setProfileModalOpen(false)} />
        )}

        <HelpCenter open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
